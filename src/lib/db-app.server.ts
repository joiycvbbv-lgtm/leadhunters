import { dbSource, getSql, type Sql } from "./db";
// Mesmo arquivo que o build aplica no banco; aqui serve de plano B se as tabelas não existirem.
import schemaSql from "../../migrations/0002_licencas.sql?raw";

let ready: Promise<void> | null = null;

async function ensureSchema(sql: Sql) {
  if (dbSource !== "neon") return; // no PGLite as migrações já rodam sozinhas
  const found = await sql.query<{ t: string | null }>("select to_regclass('public.access_keys')::text as t");
  if (found[0]?.t) return;
  try {
    await sql.query(schemaSql);
    await sql.query(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    await sql.query("insert into _migrations (name) values ('0002_licencas.sql') on conflict do nothing");
  } catch (error) {
    // Outra instância pode ter criado ao mesmo tempo: confere de novo antes de desistir.
    const again = await sql.query<{ t: string | null }>("select to_regclass('public.access_keys')::text as t");
    if (!again[0]?.t) throw error;
  }
}

/** Banco pronto para uso: conecta e garante que as tabelas do painel existem. */
export async function getDb(): Promise<Sql> {
  const sql = await getSql();
  ready ??= ensureSchema(sql).catch((error) => {
    ready = null;
    throw error;
  });
  await ready;
  return sql;
}

export function dbConfigured() {
  return dbSource === "neon" || process.env.NODE_ENV !== "production";
}
