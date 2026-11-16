import { createServerFn } from "@tanstack/react-start";

type Auth = { key: string; deviceId: string };

export type IntegrationStatus = {
  ok: true;
  googleAccountLinked: boolean;
  googlePlacesConfigured: boolean;
  whatsappMethod: "wa-link";
  googleSheetsConnected: false;
  webhookConfigured: false;
};

export const getIntegrationStatus = createServerFn({ method: "POST" })
  .validator((data: Auth) => ({ key: String(data?.key || ""), deviceId: String(data?.deviceId || "") }))
  .handler(async ({ data }): Promise<IntegrationStatus | { ok: false; error: string }> => {
    const { checkAccess } = await import("./keys.server");
    const { getDb } = await import("./db-app.server");
    const access = await checkAccess(data.key, data.deviceId, false);
    if (!access.ok) return { ok: false, error: access.code };
    const sql = await getDb();
    const rows = await sql.query<{ linked: boolean }>(
      "select exists(select 1 from google_links where key_id = $1) as linked",
      [access.keyId],
    );
    return {
      ok: true,
      googleAccountLinked: Boolean(rows[0]?.linked),
      googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_KEY?.trim()),
      whatsappMethod: "wa-link",
      googleSheetsConnected: false,
      webhookConfigured: false,
    };
  });
