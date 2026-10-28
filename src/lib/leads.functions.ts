import { createServerFn } from "@tanstack/react-start";

// Recomendado: definir GOOGLE_PLACES_KEY nas variáveis de ambiente da Vercel
// e apagar o valor de reserva abaixo (a chave nunca vai para o navegador).
function getPlacesKey() {
  return process.env.GOOGLE_PLACES_KEY || "AIzaSyArYtHwPLYnMwDF9ctcEThDDzPHYrVFQjg";
}

export type Lead = {
  id: string;
  name: string;
  category: string;
  phone: string;
  rating: number;
  reviews: number;
  address: string;
  mapsUrl: string | null;
  /** true = aberta agora, false = fechada agora, null = Google não informa horário */
  openNow: boolean | null;
  hoursToday: string | null;
  businessStatus: string;
};

export type SearchResult =
  | {
      ok: true;
      leads: Lead[];
      scanned: number;
      withSite: number;
      asked: number;
      usage: { used: number; limit: number };
    }
  | { ok: false; error: string };

type Input = {
  city: string;
  niche: string;
  neighborhood?: string;
  minReviews?: number;
  mobileOnly?: boolean;
  openOnly?: boolean;
  broad?: boolean;
  minRating: number;
  quantity: number;
  accessKey: string;
  deviceId: string;
};

export type KeyCheck =
  | {
      ok: true;
      info: {
        kind: "full" | "test";
        buyer: string;
        expiresAt: string | null;
        dailyLimit: number;
        usedToday: number;
      };
    }
  | { ok: false; code: string };

type Place = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  googleMapsUri?: string;
  businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.currentOpeningHours",
  "nextPageToken",
].join(",");

function digits(value: string) {
  let phone = value.replace(/\D/g, "");
  if (phone.startsWith("55") && phone.length > 11) phone = phone.slice(2);
  return phone;
}

function todayHours(lines?: string[]) {
  if (!lines?.length) return null;
  const weekday = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  });
  const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const line = lines[index];
  if (!line) return null;
  return line.slice(line.indexOf(":") + 1).trim() || null;
}

function toLead(place: Place, index: number, city: string): Lead | null {
  const raw = place.nationalPhoneNumber || place.internationalPhoneNumber || "";
  const phone = digits(raw);
  if (!phone) return null;
  const types = place.types ?? [];
  const category =
    types.find((type) => type !== "point_of_interest" && type !== "establishment") ||
    types[0] ||
    "Empresa";
  return {
    id: place.id || `place-${index}`,
    name: place.displayName?.text || "Sem nome",
    category: category.replace(/_/g, " "),
    phone,
    rating: place.rating || 0,
    reviews: place.userRatingCount || 0,
    address: place.formattedAddress || city,
    mapsUrl: place.googleMapsUri || null,
    openNow:
      typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
    hoursToday: todayHours(place.currentOpeningHours?.weekdayDescriptions),
    businessStatus: place.businessStatus || "OPERATIONAL",
  };
}

async function fetchPage(query: string, apiKey: string, pageToken?: string) {
  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 20,
    languageCode: "pt-BR",
    regionCode: "BR",
  };
  if (pageToken) body.pageToken = pageToken;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as {
    places?: Place[];
    nextPageToken?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    return { ok: false as const, error: payload?.error?.message || `Google recusou a busca (${response.status}).` };
  }

  return {
    ok: true as const,
    places: payload?.places ?? [],
    nextPageToken: payload?.nextPageToken,
  };
}

export const searchPlaces = createServerFn({ method: "POST" })
  .validator((data: Input) => {
    const city = (data.city || "").trim();
    const niche = (data.niche || "").trim().slice(0, 60);
    const neighborhood = String(data.neighborhood || "").trim().slice(0, 60);
    const minReviews = Math.max(0, Math.min(1000, Math.round(Number(data.minReviews) || 0)));
    const mobileOnly = Boolean(data.mobileOnly);
    const openOnly = Boolean(data.openOnly);
    const broad = Boolean(data.broad);
    const minRating = Number(data.minRating) || 0;
    const quantity = Math.min(60, Math.max(1, Math.round(Number(data.quantity) || 10)));
    const accessKey = String(data.accessKey || "");
    const deviceId = String(data.deviceId || "");
    if (!city) throw new Error("Escolha uma cidade.");
    return { city, niche, neighborhood, minReviews, mobileOnly, openOnly, broad, minRating, quantity, accessKey, deviceId };
  })
  .handler(async ({ data }): Promise<SearchResult> => {
    const { checkAccess, consumeSearch, refundSearch } = await import("./keys.server");
    const access = await checkAccess(data.accessKey, data.deviceId, false);
    if (!access.ok) return { ok: false, error: access.code };
    const limit = access.info.dailyLimit;
    const used = await consumeSearch(access.keyId, limit);
    if (used === null) return { ok: false, error: "LIMITE_DIARIO" };
    const area = data.neighborhood ? `${data.neighborhood}, ${data.city}` : data.city;
    const query = data.niche ? `${data.niche} em ${area}` : `empresas em ${area}`;
    const leads: Lead[] = [];
    const seen = new Set<string>();
    let scanned = 0;
    let withSite = 0;
    let pageToken: string | undefined;

    const take = (places: Place[], base: number) => {
      places.forEach((place, index) => {
        if (leads.length >= data.quantity) return;
        if (place.websiteUri) {
          withSite += 1;
          return;
        }
        // Empresa que o Google marca como fechada de vez não serve como lead.
        if (place.businessStatus === "CLOSED_PERMANENTLY") return;
        const lead = toLead(place, base + index, data.city);
        if (!lead || seen.has(lead.id)) return;
        if (lead.rating < data.minRating || lead.reviews < data.minReviews) return;
        if (data.mobileOnly && !(lead.phone.length === 11 && lead.phone[2] === "9")) return;
        if (data.openOnly && lead.openNow !== true) return;
        seen.add(lead.id);
        leads.push(lead);
      });
    };

    try {
      for (let page = 0; page < 3 && leads.length < data.quantity; page += 1) {
        if (page > 0) await new Promise((resolve) => setTimeout(resolve, 1800));
        const pageResult = await fetchPage(query, getPlacesKey(), pageToken);
        if (!pageResult.ok) {
          await refundSearch(access.keyId);
          return pageResult;
        }
        scanned += pageResult.places.length;
        take(pageResult.places, page * 20);

        // Busca ampla: pergunta de outros jeitos ao Google para achar empresas que a primeira busca não trouxe.
        if (page === 0 && data.broad && leads.length < data.quantity) {
          const variants = data.niche
            ? [`${data.niche} ${area}`, `${data.niche} perto de ${area}`, `melhores ${data.niche} ${area}`]
            : [`comércio ${area}`, `serviços ${area}`];
          const extra = await Promise.all(variants.map((variant) => fetchPage(variant, getPlacesKey())));
          extra.forEach((result, position) => {
            if (!result.ok) return;
            scanned += result.places.length;
            take(result.places, 100 * (position + 1));
          });
        }

        pageToken = pageResult.nextPageToken;
        if (!pageToken) break;
      }
    } catch {
      await refundSearch(access.keyId);
      return { ok: false, error: "Não consegui falar com o Google. Tente de novo." };
    }

    return { ok: true, leads, scanned, withSite, asked: data.quantity, usage: { used, limit } };
  });

export const checkAccessKey = createServerFn({ method: "POST" })
  .validator((data: { key: string; deviceId: string; bind?: boolean }) => ({
    key: String(data?.key || ""),
    deviceId: String(data?.deviceId || ""),
    bind: Boolean(data?.bind),
  }))
  .handler(async ({ data }): Promise<KeyCheck> => {
    try {
      const { dbConfigured } = await import("./db-app.server");
      if (!dbConfigured()) return { ok: false, code: "SEM_BANCO" };
      const { checkAccess } = await import("./keys.server");
      const access = await checkAccess(data.key, data.deviceId, data.bind);
      // Pequena espera nas tentativas erradas para travar adivinhação.
      if (!access.ok && access.code === "KEY_INVALIDA") await new Promise((resolve) => setTimeout(resolve, 700));
      return access.ok ? { ok: true, info: access.info } : { ok: false, code: access.code };
    } catch (error) {
      console.error("[checkAccessKey]", error);
      return { ok: false, code: "ERRO_SERVIDOR" };
    }
  });

