import { createServerFn } from "@tanstack/react-start";

export type CloudData = {
  pipeline?: unknown[];
  ticket?: number;
  message?: string;
  followMessage?: string;
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
