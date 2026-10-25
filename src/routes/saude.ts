import { createFileRoute } from "@tanstack/react-router";

/** Diagnóstico rápido: abra /api/saude para ver se banco e variáveis estão certos. Não mostra segredos. */
async function handle() {
  const has = (name: string) => Boolean((process.env[name] || "").trim());
  const out: Record<string, unknown> = {
    banco: has("DATABASE_URL") || has("POSTGRES_URL") ? "neon (conexão encontrada)" : "SEM DATABASE_URL — conecte o Neon na Vercel",
    variaveis: {
      ADMIN_PASSWORD: has("ADMIN_PASSWORD"),
      SESSION_SECRET: has("SESSION_SECRET"),
      GOOGLE_PLACES_KEY: has("GOOGLE_PLACES_KEY"),
      ABACATEPAY_API_KEY: has("ABACATEPAY_API_KEY"),
      MERCADOPAGO_ACCESS_TOKEN: has("MERCADOPAGO_ACCESS_TOKEN"),
    },
  };
  try {
    const { getDb } = await import("@/lib/db-app.server");
    const sql = await getDb();
    const keys = await sql.query<{ n: number }>("select count(*) as n from access_keys");
    out.tabelas = "ok";
    out.keysNoBanco = keys[0]?.n ?? 0;
  } catch (error) {
    out.tabelas = `ERRO: ${String((error as Error)?.message || error).slice(0, 160)}`;
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/saude")({
  server: { handlers: { GET: handle } },
});
