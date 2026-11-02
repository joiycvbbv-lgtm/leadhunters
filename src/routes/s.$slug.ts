import { createFileRoute } from "@tanstack/react-router";

const PAGE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  // O site roda isolado (sem acesso ao painel) e só pode carregar o necessário.
  "content-security-policy":
    "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; default-src 'none'; img-src data: https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; frame-src https://www.google.com; base-uri 'none'; form-action 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

function notFound() {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site não encontrado</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f8ff;color:#0e2a4a;text-align:center"><div><h1 style="font-size:28px;margin:0 0 8px">Site não encontrado</h1><p style="margin:0;color:#5a7391">Esse endereço não existe mais ou a prévia expirou.</p></div></body>`,
    { status: 404, headers: { ...PAGE_HEADERS, "cache-control": "no-store" } },
  );
}

async function handle({ params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    if (!slug) return notFound();
    const { getDb } = await import("@/lib/db-app.server");
    const { buildSite, finalizeHosted } = await import("@/lib/site-builder");
    const sql = await getDb();
    const rows = await sql.query<{ data: string; kind: string; indexable: boolean }>(
      `select data, kind, indexable from sites
        where slug = $1 and status = 'ativo' and (expires_at is null or expires_at > now())`,
      [slug],
    );
    const row = rows[0];
    if (!row) return notFound();
    sql.query("update sites set views = views + 1 where slug = $1", [slug]).catch(() => undefined);
    const mode = row.kind === "final" ? "final" : "previa";
    const html = finalizeHosted(buildSite(JSON.parse(row.data)), mode, row.indexable);
    return new Response(html, {
      status: 200,
      headers: { ...PAGE_HEADERS, "cache-control": "public, max-age=60, s-maxage=60" },
    });
  } catch (error) {
    console.error("[site]", error);
    return notFound();
  }
}

export const Route = createFileRoute("/s/$slug")({
  server: { handlers: { GET: handle } },
});
