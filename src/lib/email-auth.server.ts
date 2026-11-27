import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { dbConfigured, getDb } from "./db-app.server";
import { checkAccess, generateKey, hashKey, issueSessionToken } from "./keys.server";
import type { Sql } from "./db";

const derive = promisify(scrypt);

async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = await derive(password, salt, 64) as Buffer;
  return salt + ":" + hash.toString("hex");
}

async function verifyPassword(password: string, stored: string | undefined) {
  const [salt, hash] = (stored ?? "00000000000000000000000000000000:" + "0".repeat(128)).split(":");
  const actual = Buffer.from((await hashPassword(password, salt)).split(":")[1], "hex");
  const expected = Buffer.from(hash, "hex");
  return Boolean(stored) && actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function allowAttempt(sql: Sql, scope: string, limit: number) {
  const key = createHash("sha256").update(scope).digest("hex");
  const rows = await sql.query<{ attempts: number }>(
    `insert into email_auth_attempts (scope, attempts, reset_at)
     values ($1, 1, now() + interval '15 minutes')
     on conflict (scope) do update set
       attempts = case when email_auth_attempts.reset_at <= now() then 1 else email_auth_attempts.attempts + 1 end,
       reset_at = case when email_auth_attempts.reset_at <= now() then excluded.reset_at else email_auth_attempts.reset_at end
     returning attempts`,
    [key],
  );
  return rows[0].attempts <= limit;
}

export async function authenticate(data: {
  mode: "login" | "signup";
  email: string;
  password: string;
  name: string;
  deviceId: string;
}) {
  const { mode, email, password, name, deviceId } = data;
  const invalid = (code: string) => ({ ok: false as const, code });
  if (!dbConfigured()) return invalid("SEM_BANCO");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 || password.length > 128 || deviceId.length < 8 || deviceId.length > 80 ||
      (mode === "signup" && (name.length < 2 || name.length > 100))) return invalid("DADOS_INVALIDOS");

  const sql = await getDb();
  if (!await allowAttempt(sql, mode + ":email:" + email, 8) ||
      !await allowAttempt(sql, mode + ":device:" + deviceId, mode === "signup" ? 3 : 20)) {
    return invalid("MUITAS_TENTATIVAS");
  }

  let keyId: number;
  if (mode === "signup") {
    const passwordHash = await hashPassword(password);
    try {
      const created = await sql.query<{ key_id: number }>(
        `with new_key as (
           insert into access_keys (key_hash, kind, status, buyer, note, daily_limit, max_devices, plan_id)
           values ($1, 'free', 'ativa', $2, 'Plano grátis via e-mail', 3, 3, 'free')
           returning id
         )
         insert into email_accounts (email, password_hash, key_id)
         select $3, $4, id from new_key returning key_id`,
        [hashKey(generateKey("full")), name, email, passwordHash],
      );
      keyId = created[0].key_id;
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return invalid("CADASTRO_INDISPONIVEL");
      throw error;
    }
  } else {
    const [account] = await sql.query<{ key_id: number; password_hash: string }>(
      "select key_id, password_hash from email_accounts where email = $1",
      [email],
    );
    if (!await verifyPassword(password, account?.password_hash)) return invalid("CREDENCIAIS_INVALIDAS");
    keyId = account.key_id;
  }

  const token = issueSessionToken(keyId);
  const access = await checkAccess(token, deviceId, true);
  if (!access.ok) return invalid(access.code);
  return { ok: true as const, token, info: access.info };
}
