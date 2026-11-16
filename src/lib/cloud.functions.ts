import { createServerFn } from "@tanstack/react-start";

export type CloudData = {
  pipeline?: unknown[];
  ticket?: number;
  message?: string;
  followMessage?: string;
  goal?: number;
  userName?: string;
  profilePhoto?: string;
  customMessages?: { id: string; name: string; text: string; category: string }[];
  searchHistory?: { id: string; at: string; city: string; niche: string; count: number; businesses?: string[] }[];
  preferences?: { city?: string; niche?: string; quantity?: number; minRating?: number; neighborhood?: string; minReviews?: number; mobileOnly?: boolean; onlyOpen?: boolean; broad?: boolean; siteMode?: "sem" | "social" | "todas" };
};

export type CloudLoad = { ok: true; data: CloudData; version: number } | { ok: false; code: string };
export type CloudSave =
  | { ok: true; version: number }
  | { ok: false; conflict: true; data: CloudData; version: number }
  | { ok: false; conflict?: false; code: string };

type Auth = { key: string; deviceId: string };
const auth = (data: Auth) => ({ key: String(data?.key || ""), deviceId: String(data?.deviceId || "") });

export const loadCloud = createServerFn({ method: "POST" })
  .validator((data: Auth) => auth(data))
  .handler(async ({ data }): Promise<CloudLoad> => {
    const { checkAccess } = await import("./keys.server");
    const { getDb: getSql } = await import("./db-app.server");
    const access = await checkAccess(data.key, data.deviceId, false);
    if (!access.ok) return { ok: false, code: access.code };
    const sql = await getSql();
    const rows = await sql.query<{ data: CloudData; version: number }>(
      "select data, version from key_data where key_id = $1",
      [access.keyId],
    );
    return { ok: true, data: rows[0]?.data ?? {}, version: rows[0]?.version ?? 0 };
  });

export const saveCloud = createServerFn({ method: "POST" })
  .validator((data: Auth & { payload: CloudData; baseVersion: number }) => ({
    ...auth(data),
    payload: (data?.payload ?? {}) as CloudData,
    baseVersion: Math.max(0, Math.floor(Number(data?.baseVersion) || 0)),
  }))
  .handler(async ({ data }): Promise<CloudSave> => {
    const { checkAccess } = await import("./keys.server");
    const { getDb: getSql } = await import("./db-app.server");
    const access = await checkAccess(data.key, data.deviceId, false);
    if (!access.ok) return { ok: false, code: access.code };

    const payload: CloudData = {
      pipeline: Array.isArray(data.payload.pipeline) ? data.payload.pipeline.slice(0, 5000) : [],
      ticket: Number(data.payload.ticket) || 0,
      message: String(data.payload.message ?? "").slice(0, 2000),
      followMessage: String(data.payload.followMessage ?? "").slice(0, 2000),
      goal: Math.max(0, Number(data.payload.goal) || 0),
      userName: String(data.payload.userName ?? "").slice(0, 100),
      profilePhoto: /^data:image\/(webp|png|jpeg);base64,/.test(String(data.payload.profilePhoto ?? "")) && String(data.payload.profilePhoto).length <= 240_000
        ? String(data.payload.profilePhoto)
        : "",
      customMessages: (Array.isArray(data.payload.customMessages) ? data.payload.customMessages : []).slice(0, 100).map((item) => ({
        id: String(item?.id ?? "").slice(0, 80),
        name: String(item?.name ?? "").slice(0, 100),
        text: String(item?.text ?? "").slice(0, 2000),
        category: String(item?.category ?? "").slice(0, 40),
      })),
      searchHistory: (Array.isArray(data.payload.searchHistory) ? data.payload.searchHistory : []).slice(-1000).map((item) => ({
        id: String(item?.id ?? "").slice(0, 80),
        at: String(item?.at ?? "").slice(0, 40),
        city: String(item?.city ?? "").slice(0, 100),
        niche: String(item?.niche ?? "").slice(0, 100),
        count: Math.max(0, Math.min(1000, Number(item?.count) || 0)),
        businesses: Array.isArray(item?.businesses) ? item.businesses.slice(0, 25).map((name) => String(name).slice(0, 100)) : [],
      })),
      preferences: {
        city: String(data.payload.preferences?.city ?? "").slice(0, 100),
        niche: String(data.payload.preferences?.niche ?? "restaurante").slice(0, 100),
        quantity: Math.max(5, Math.min(60, Math.floor(Number(data.payload.preferences?.quantity) || 10))),
        minRating: Math.max(0, Math.min(5, Number(data.payload.preferences?.minRating) || 0)),
        neighborhood: String(data.payload.preferences?.neighborhood ?? "").slice(0, 100),
        minReviews: Math.max(0, Math.min(100_000, Number(data.payload.preferences?.minReviews) || 0)),
        mobileOnly: Boolean(data.payload.preferences?.mobileOnly),
        onlyOpen: Boolean(data.payload.preferences?.onlyOpen),
        broad: Boolean(data.payload.preferences?.broad),
        siteMode: data.payload.preferences?.siteMode === "sem" || data.payload.preferences?.siteMode === "todas" ? data.payload.preferences.siteMode : "social",
      },
    };
    const json = JSON.stringify(payload);
    if (json.length > 2_000_000) return { ok: false, code: "MUITO_GRANDE" };

    const sql = await getSql();
    const rows = await sql.query<{ version: number }>(
      `insert into key_data (key_id, data, version) values ($1, $2::jsonb, 1)
       on conflict (key_id) do update set data = $2::jsonb, version = key_data.version + 1, updated_at = now()
         where key_data.version = $3
       returning version`,
      [access.keyId, json, data.baseVersion],
    );
    if (rows[0]) return { ok: true, version: rows[0].version };

    const current = await sql.query<{ data: CloudData; version: number }>(
      "select data, version from key_data where key_id = $1",
      [access.keyId],
    );
    return { ok: false, conflict: true, data: current[0]?.data ?? {}, version: current[0]?.version ?? 0 };
  });
