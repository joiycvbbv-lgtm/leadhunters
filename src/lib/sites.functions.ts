import { createServerFn } from "@tanstack/react-start";
import type { SiteData } from "./site-builder";

export type MySite = {
  slug: string;
  name: string;
  kind: "previa" | "final";
  indexable: boolean;
  views: number;
  status: string;
  createdAt: string;
  expiresAt: string | null;
};

export type PublishResult =
  | { ok: true; slug: string; kind: "previa" | "final" }
  | { ok: false; error: string };

export type PlaceDetails = {
  name: string;
  address: string;
  city: string;
  phone: string;
  category: string;
  rating: number;
  reviews: number;
  mapsUrl: string;
  hours: string[];
};

type Auth = { key: string; deviceId: string };
const auth = (data: Auth) => ({ key: String(data?.key || ""), deviceId: String(data?.deviceId || "") });
const cleanSlug = (value: unknown) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 60);

const MAX_SITES = 30;
const MAX_BYTES = 3_400_000;
const ISO = (column: string) => `to_char(${column} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

/* ---------- Horários e dados da empresa a partir do Google (usa 1 busca) ---------- */

export const placeDetails = createServerFn({ method: "POST" })
  .validator((data: Auth & { placeId: string }) => ({ ...auth(data), placeId: String(data?.placeId || "").slice(0, 200) }))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; place: PlaceDetails; usage: { used: number; limit: number } } | { ok: false; error: string }> => {
      const { checkAccess, consumeSearch, refundSearch } = await import("./keys.server");
      const access = await checkAccess(data.key, data.deviceId, false);
      if (!access.ok) return { ok: false, error: access.code };
      if (!/^[A-Za-z0-9_-]{10,}$/.test(data.placeId)) {
        return { ok: false, error: "Esse lead não veio do Google, então preencha os dados na mão." };
      }
      const limit = access.info.dailyLimit;
      const used = await consumeSearch(access.keyId, limit);
      if (used === null) return { ok: false, error: "LIMITE_DIARIO" };
      try {
        const apiKey = process.env.GOOGLE_PLACES_KEY || "AIzaSyArYtHwPLYnMwDF9ctcEThDDzPHYrVFQjg";
        const response = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(data.placeId)}?languageCode=pt-BR&regionCode=BR`,
          {
            headers: {
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "displayName,formattedAddress,nationalPhoneNumber,rating,userRatingCount,googleMapsUri,primaryTypeDisplayName,regularOpeningHours",
            },
            signal: AbortSignal.timeout(8000),
          },
        );
        if (!response.ok) {
          await refundSearch(access.keyId);
          return { ok: false, error: "O Google não respondeu agora. Tente de novo." };
        }
        const p = (await response.json()) as {
          displayName?: { text?: string };
          formattedAddress?: string;
          nationalPhoneNumber?: string;
          rating?: number;
          userRatingCount?: number;
          googleMapsUri?: string;
          primaryTypeDisplayName?: { text?: string };
          regularOpeningHours?: { weekdayDescriptions?: string[] };
        };
        const address = p.formattedAddress || "";
        const m = address.match(/,\s*([^,]+?)\s-\s([A-Z]{2})(?:,|$)/);
        return {
          ok: true,
          usage: { used, limit },
          place: {
            name: p.displayName?.text || "",
            address,
            city: m ? `${m[1]}, ${m[2]}` : "",
            phone: (p.nationalPhoneNumber || "").replace(/\D/g, ""),
            category: p.primaryTypeDisplayName?.text || "",
            rating: p.rating || 0,
            reviews: p.userRatingCount || 0,
            mapsUrl: p.googleMapsUri || "",
            hours: p.regularOpeningHours?.weekdayDescriptions ?? [],
          },
        };
      } catch {
        await refundSearch(access.keyId);
        return { ok: false, error: "Não consegui consultar agora. Tente de novo." };
      }
    },
  );

/* ---------- Publicar / listar / mudar modo / apagar ---------- */

export const publishSite = createServerFn({ method: "POST" })
  .validator(
    (data: Auth & { slug?: string; leadRef: string; site: SiteData; kind: "previa" | "final"; indexable: boolean }) => ({
      ...auth(data),
      slug: cleanSlug(data?.slug),
      leadRef: String(data?.leadRef || "").slice(0, 200),
      site: (data?.site ?? {}) as SiteData,
      kind: data?.kind === "final" ? ("final" as const) : ("previa" as const),
      indexable: Boolean(data?.indexable),
    }),
  )
  .handler(async ({ data }): Promise<PublishResult> => {
    try {
      const { checkAccess } = await import("./keys.server");
      const { getDb } = await import("./db-app.server");
      const { sanitizeSite, slugify } = await import("./site-builder");
      const access = await checkAccess(data.key, data.deviceId, false);
      if (!access.ok) return { ok: false, error: access.code };
      if (access.info.kind === "test") {
        return { ok: false, error: "A key de teste não publica sites. Escolha um plano para publicar." };
      }
      const site = sanitizeSite(data.site);
      if (site.name.length < 2) return { ok: false, error: "Preencha o nome da empresa." };
      const json = JSON.stringify(site);
      if (json.length > MAX_BYTES) {
        return { ok: false, error: "As fotos ficaram pesadas demais. Use menos fotos ou fotos menores." };
      }
      const sql = await getDb();
      const indexable = data.indexable && data.kind === "final";

      if (data.slug) {
        const own = await sql.query<{ id: number }>("select id from sites where slug = $1 and key_id = $2", [
          data.slug,
          access.keyId,
        ]);
        if (own.length) {
          await sql.query(
            `update sites set data = $2, name = $3, kind = $4, indexable = $5, updated_at = now(),
                    expires_at = case when $4 = 'previa' then now() + interval '30 days' else null end
              where id = $1`,
            [own[0].id, json, site.name, data.kind, indexable],
          );
          return { ok: true, slug: data.slug, kind: data.kind };
        }
      }

      const count = await sql.query<{ n: number }>("select count(*) as n from sites where key_id = $1", [access.keyId]);
      if ((count[0]?.n ?? 0) >= MAX_SITES) {
        return { ok: false, error: `Você chegou ao limite de ${MAX_SITES} sites. Apague algum em "Meus sites".` };
      }
      const { randomInt } = await import("node:crypto");
      const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const suffix = Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("");
        const slug = `${slugify(site.name)}-${suffix}`;
        const rows = await sql.query<{ id: number }>(
          `insert into sites (slug, key_id, lead_ref, name, data, kind, indexable, expires_at)
           values ($1,$2,$3,$4,$5,$6,$7, case when $6 = 'previa' then now() + interval '30 days' else null end)
           on conflict (slug) do nothing returning id`,
          [slug, access.keyId, data.leadRef, site.name, json, data.kind, indexable],
        );
        if (rows.length) return { ok: true, slug, kind: data.kind };
      }
      return { ok: false, error: "Não consegui gerar o endereço. Tente de novo." };
    } catch (error) {
      console.error("[publishSite]", error);
      return { ok: false, error: "Erro no servidor ao publicar. Tente de novo." };
    }
  });

export const listMySites = createServerFn({ method: "POST" })
  .validator((data: Auth) => auth(data))
  .handler(async ({ data }): Promise<{ ok: true; sites: MySite[] } | { ok: false; error: string }> => {
    const { checkAccess } = await import("./keys.server");
    const { getDb } = await import("./db-app.server");
    const access = await checkAccess(data.key, data.deviceId, false);
    if (!access.ok) return { ok: false, error: access.code };
    const sql = await getDb();
    const rows = await sql.query<{
      slug: string;
      name: string;
      kind: string;
      indexable: boolean;
      views: number;
      status: string;
      created_at: string;
      expires_at: string | null;
    }>(
      `select slug, name, kind, indexable, views, status, ${ISO("created_at")} as created_at, ${ISO("expires_at")} as expires_at
         from sites where key_id = $1 order by id desc limit 100`,
      [access.keyId],
    );
    return {
      ok: true,
      sites: rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        kind: r.kind === "final" ? "final" : "previa",
        indexable: r.indexable,
        views: Number(r.views),
        status: r.status,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      })),
    };
  });

export const setSiteMode = createServerFn({ method: "POST" })
  .validator((data: Auth & { slug: string; kind: "previa" | "final"; indexable: boolean }) => ({
    ...auth(data),
    slug: cleanSlug(data?.slug),
    kind: data?.kind === "final" ? ("final" as const) : ("previa" as const),
    indexable: Boolean(data?.indexable),
  }))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const { checkAccess } = await import("./keys.server");
    const { getDb } = await import("./db-app.server");
    const access = await checkAccess(data.key, data.deviceId, false);
    if (!access.ok) return { ok: false, error: access.code };
    const sql = await getDb();
    await sql.query(
      `update sites set kind = $3, indexable = $4, updated_at = now(),
              expires_at = case when $3 = 'previa' then now() + interval '30 days' else null end
        where slug = $1 and key_id = $2`,
      [data.slug, access.keyId, data.kind, data.indexable && data.kind === "final"],
    );
    return { ok: true };
  });

export const deleteSite = createServerFn({ method: "POST" })
  .validator((data: Auth & { slug: string }) => ({ ...auth(data), slug: cleanSlug(data?.slug) }))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const { checkAccess } = await import("./keys.server");
    const { getDb } = await import("./db-app.server");
    const access = await checkAccess(data.key, data.deviceId, false);
    if (!access.ok) return { ok: false, error: access.code };
    const sql = await getDb();
    await sql.query("delete from sites where slug = $1 and key_id = $2", [data.slug, access.keyId]);
    return { ok: true };
  });

/** Site já publicado para um lead (para continuar editando, com as fotos). */
export const getSiteForLead = createServerFn({ method: "POST" })
  .validator((data: Auth & { leadRef: string }) => ({ ...auth(data), leadRef: String(data?.leadRef || "").slice(0, 200) }))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; found: false }
      | { ok: true; found: true; slug: string; kind: "previa" | "final"; indexable: boolean; site: SiteData }
      | { ok: false; error: string }
    > => {
      const { checkAccess } = await import("./keys.server");
      const { getDb } = await import("./db-app.server");
      const access = await checkAccess(data.key, data.deviceId, false);
      if (!access.ok) return { ok: false, error: access.code };
      if (!data.leadRef) return { ok: true, found: false };
      const sql = await getDb();
      const rows = await sql.query<{ slug: string; kind: string; indexable: boolean; data: string }>(
        "select slug, kind, indexable, data from sites where key_id = $1 and lead_ref = $2 order by id desc limit 1",
        [access.keyId, data.leadRef],
      );
      const row = rows[0];
      if (!row) return { ok: true, found: false };
      try {
        return {
          ok: true,
          found: true,
          slug: row.slug,
          kind: row.kind === "final" ? "final" : "previa",
          indexable: row.indexable,
          site: JSON.parse(row.data) as SiteData,
        };
      } catch {
        return { ok: true, found: false };
      }
    },
  );
