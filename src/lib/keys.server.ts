import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { getDb as getSql } from "./db-app.server";

/* ---------- formato e hash das keys ---------- */

export function normalizeKey(raw: string) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashKey(raw: string) {
  return createHash("sha256")
    .update("lh1:" + normalizeKey(raw))
    .digest("hex");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export function generateKey(kind: "full" | "test") {
  return kind === "test"
    ? `LH-TEST-${group()}-${group()}-${group()}`
    : `LH-${group()}-${group()}-${group()}-${group()}`;
}

/* ---------- tokens assinados (painel admin) ---------- */

function secret() {
  // Recomendado: definir SESSION_SECRET nas variáveis de ambiente da Vercel.
  return process.env.SESSION_SECRET || "lh-segredo-padrao-troque-na-vercel-7f3a9c";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueAdminToken() {
  const exp = Date.now() + 12 * 3600_000;
  return `${exp}.${sign("admin:" + exp)}`;
}

export function verifyAdminToken(token: string) {
  const [expRaw, mac] = String(token || "").split(".");
  const exp = Number(expRaw);
  if (!exp || !mac || Date.now() > exp) return false;
  const good = Buffer.from(sign("admin:" + exp));
  const given = Buffer.from(mac);
  return good.length === given.length && timingSafeEqual(good, given);
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return "sem-senha" as const;
  const a = createHash("sha256").update(String(password || "")).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) ? ("ok" as const) : ("errada" as const);
}

/* ---------- acesso por key (banco de dados) ---------- */

export type AccessInfo = {
  kind: "full" | "test";
  buyer: string;
  expiresAt: string | null;
  dailyLimit: number;
  usedToday: number;
};

export type AccessResult =
  | { ok: true; keyId: number; info: AccessInfo }
  | { ok: false; code: "KEY_INVALIDA" | "KEY_REVOGADA" | "KEY_EXPIRADA" | "APARELHOS" | "NAO_VINCULADO" };

type KeyRow = {
  id: number;
  kind: string;
  status: string;
  buyer: string;
  daily_limit: number;
  max_devices: number;
  valid_days: number | null;
  valid_minutes: number | null;
  activated_at: string | null;
  expires_at: string | null;
};

const TODAY = "(now() at time zone 'America/Sao_Paulo')::date";

export async function usedToday(keyId: number) {
  const sql = await getSql();
  const rows = await sql.query<{ count: number }>(
    `select count from search_usage where key_id = $1 and day = ${TODAY}`,
    [keyId],
  );
  return rows[0]?.count ?? 0;
}

/**
 * Confere key + aparelho. Com bind=true (tela de login) registra o aparelho
 * e inicia a validade no primeiro uso.
 */
export async function checkAccess(rawKey: string, deviceId: string, bind: boolean): Promise<AccessResult> {
  const key = normalizeKey(rawKey);
  const device = String(deviceId || "").slice(0, 80);
  if (key.length !== 18 || device.length < 8) return { ok: false, code: "KEY_INVALIDA" };

  const sql = await getSql();
  const rows = await sql.query<KeyRow>(
    `select id, kind, status, buyer, daily_limit, max_devices, valid_days, valid_minutes,
            activated_at::text as activated_at, to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at
       from access_keys where key_hash = $1`,
    [hashKey(key)],
  );
  const row = rows[0];
  if (!row) return { ok: false, code: "KEY_INVALIDA" };
  if (row.status !== "ativa") return { ok: false, code: "KEY_REVOGADA" };
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return { ok: false, code: "KEY_EXPIRADA" };
  }

  const known = await sql.query<{ device_id: string }>(
    "select device_id from key_devices where key_id = $1 and device_id = $2",
    [row.id, device],
  );
  if (known.length) {
    await sql.query(
      "update key_devices set last_seen = now() where key_id = $1 and device_id = $2 and last_seen < now() - interval '5 minutes'",
      [row.id, device],
    );
  } else {
    if (!bind) return { ok: false, code: "NAO_VINCULADO" };
    const count = await sql.query<{ n: number }>("select count(*) as n from key_devices where key_id = $1", [row.id]);
    if ((count[0]?.n ?? 0) >= row.max_devices) return { ok: false, code: "APARELHOS" };
    await sql.query("insert into key_devices (key_id, device_id) values ($1, $2) on conflict do nothing", [
      row.id,
      device,
    ]);
  }

  let expiresAt = row.expires_at;
  if (!row.activated_at) {
    // Primeiro login: começa a contar a validade.
    const updated = await sql.query<{ expires_at: string | null }>(
      `update access_keys set activated_at = now(),
              expires_at = case
                when valid_minutes is not null then now() + make_interval(mins => valid_minutes)
                when valid_days is not null then now() + make_interval(days => valid_days)
                else null end
        where id = $1 and activated_at is null
        returning to_char(expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at`,
      [row.id],
    );
    if (updated[0]) expiresAt = updated[0].expires_at;
  }

  return {
    ok: true,
    keyId: row.id,
    info: {
      kind: row.kind === "test" ? "test" : "full",
      buyer: row.buyer,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      dailyLimit: row.daily_limit,
      usedToday: await usedToday(row.id),
    },
  };
}

/** Conta uma busca de forma atômica. Devolve null se o limite diário já foi atingido. */
export async function consumeSearch(keyId: number, limit: number) {
  const sql = await getSql();
  const rows = await sql.query<{ count: number }>(
    `insert into search_usage (key_id, day, count) values ($1, ${TODAY}, 1)
     on conflict (key_id, day) do update set count = search_usage.count + 1
       where search_usage.count < $2
     returning count`,
    [keyId, limit],
  );
  return rows[0]?.count ?? null;
}

export async function refundSearch(keyId: number) {
  const sql = await getSql();
  await sql.query(
    `update search_usage set count = greatest(count - 1, 0) where key_id = $1 and day = ${TODAY}`,
    [keyId],
  );
}

/** Cria keys novas no banco e devolve o texto delas. */
export async function createKeys(opts: {
  count: number;
  kind: "full" | "test";
  buyer?: string;
  note?: string;
  dailyLimit: number;
  maxDevices: number;
  validDays?: number | null;
  validMinutes?: number | null;
}) {
  const sql = await getSql();
  const made: { id: number; key: string }[] = [];
  for (let i = 0; i < opts.count; i += 1) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const key = generateKey(opts.kind);
      const rows = await sql.query<{ id: number }>(
        `insert into access_keys (key_hash, key_plain, kind, buyer, note, daily_limit, max_devices, valid_days, valid_minutes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (key_hash) do nothing returning id`,
        [
          hashKey(key),
          key,
          opts.kind,
          opts.buyer || "",
          opts.note || "",
          opts.dailyLimit,
          opts.maxDevices,
          opts.validDays ?? null,
          opts.validMinutes ?? null,
        ],
      );
      if (rows[0]) {
        made.push({ id: rows[0].id, key });
        break;
      }
    }
  }
  return made;
}
