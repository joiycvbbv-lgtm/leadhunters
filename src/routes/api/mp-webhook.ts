import { createFileRoute } from "@tanstack/react-router";

/** Aviso do Mercado Pago quando um Pix é pago. Só serve para liberar a key mais rápido. */
async function handle({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";
    if (!paymentId && request.method === "POST") {
      const body = (await request.json().catch(() => null)) as { data?: { id?: string | number } } | null;
      paymentId = body?.data?.id ? String(body.data.id) : "";
    }
    if (paymentId) {
      const { getDb: getSql } = await import("@/lib/db-app.server");
      const { fulfillOrder } = await import("@/lib/shop.server");
      const sql = await getSql();
      const rows = await sql.query<{ id: string }>("select id from orders where mp_payment_id = $1", [paymentId]);
      // fulfillOrder confere o pagamento direto no Mercado Pago; o aviso em si não é confiado.
      if (rows[0]) await fulfillOrder(rows[0].id);
    }
  } catch (error) {
    console.error("[mp-webhook]", error);
  }
  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/mp-webhook")({
  server: { handlers: { GET: handle, POST: handle } },
});
