import { createFileRoute } from "@tanstack/react-router";

/** Readiness pública: confirma somente que o serviço e o banco respondem. */
async function handle() {
  try {
    const { getDb } = await import("@/lib/db-app.server");
    const sql = await getDb();
    await sql.query("select 1");
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    // A causa detalhada fica apenas nos logs do servidor.
    console.error("[health-check]", error);
    return new Response(JSON.stringify({ status: "indisponivel" }), {
      status: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }
}

export const Route = createFileRoute("/api/saude")({
  server: { handlers: { GET: handle } },
});
