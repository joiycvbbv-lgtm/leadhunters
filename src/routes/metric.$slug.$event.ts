import { createFileRoute } from "@tanstack/react-router";

const PIXEL = new Uint8Array([71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59]);

async function handle({ params }: { params: { slug: string; event: string } }) {
  const slug = String(params.slug || "").toLowerCase();
  const event = String(params.event || "");
  if (!/^[a-z0-9-]{1,80}$/.test(slug) || !["whatsapp", "form"].includes(event)) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  try {
    const { getDb } = await import("@/lib/db-app.server");
    const sql = await getDb();
    const column = event === "whatsapp" ? "whatsapp_clicks" : "form_submissions";
    await sql.query(`update sites set ${column} = ${column} + 1 where slug = $1 and kind = 'final' and status = 'ativo'`, [slug]);
  } catch (error) {
    console.error("[site metric]", error);
  }
  return new Response(PIXEL, {
    status: 200,
    headers: { "content-type": "image/gif", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

export const Route = createFileRoute("/metric/$slug/$event")({
  server: { handlers: { GET: handle } },
});
