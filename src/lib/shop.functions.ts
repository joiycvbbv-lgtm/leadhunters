import { createServerFn } from "@tanstack/react-start";
import { PLANS } from "./plans";

export type OrderView = {
  ok: true;
  orderId: string;
  status: string;
  plan: string;
  amountCents: number;
  qrCode: string;
  qrBase64: string;
  key: string | null;
  days: number | null;
};
export type ShopFail = { ok: false; error: string };

export const createPix = createServerFn({ method: "POST" })
  .validator((data: { plan: string; name: string; email: string; whatsapp: string; origin?: string }) => ({
    plan: String(data?.plan || ""),
    name: String(data?.name || "").trim().slice(0, 100),
    email: String(data?.email || "").trim().toLowerCase().slice(0, 120),
    whatsapp: String(data?.whatsapp || "").replace(/\D/g, "").slice(0, 15),
    origin: String(data?.origin || ""),
  }))
  .handler(async ({ data }): Promise<OrderView | ShopFail> => {
    const plan = PLANS.find((p) => p.id === data.plan);
    if (!plan) return { ok: false, error: "Escolha um plano." };
    if (data.name.length < 3) return { ok: false, error: "Digite seu nome completo." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return { ok: false, error: "Digite um e-mail válido." };
    if (data.whatsapp.length < 10) return { ok: false, error: "Digite seu WhatsApp com DDD." };

    const { mpToken, mpCreatePix } = await import("./shop.server");
    if (!mpToken()) {
      return { ok: false, error: "Pagamento ainda não configurado. Fale com o vendedor para receber sua key." };
    }
    const { getDb: getSql } = await import("./db-app.server");
    const { randomUUID } = await import("node:crypto");
    const sql = await getSql();

    const recent = await sql.query<{ n: number }>(
      `select count(*) as n from orders
        where status = 'pendente' and created_at > now() - interval '1 hour'
          and (buyer_email = $1 or buyer_whatsapp = $2)`,
      [data.email, data.whatsapp],
    );
    if ((recent[0]?.n ?? 0) >= 3) {
      return { ok: false, error: "Você já gerou vários Pix. Pague um deles ou tente de novo daqui a pouco." };
    }

    const orderId = randomUUID();
    await sql.query(
      `insert into orders (id, plan, amount_cents, buyer_name, buyer_email, buyer_whatsapp)
       values ($1,$2,$3,$4,$5,$6)`,
      [orderId, plan.id, plan.priceCents, data.name, data.email, data.whatsapp],
    );

    const notificationUrl = /^https:\/\/[^\s/]+$/.test(data.origin) ? `${data.origin}/api/mp-webhook` : undefined;
    const pix = await mpCreatePix({
      orderId,
      amountCents: plan.priceCents,
      description: `LeadHunter — plano ${plan.name}`,
      email: data.email,
      name: data.name,
      notificationUrl,
    });
    if (!pix.ok) {
      await sql.query("update orders set status = 'erro' where id = $1", [orderId]);
      return { ok: false, error: pix.error };
    }
    await sql.query("update orders set mp_payment_id = $2, qr_code = $3, qr_base64 = $4 where id = $1", [
      orderId,
      pix.paymentId,
      pix.qrCode,
      pix.qrBase64,
    ]);
    return {
      ok: true,
      orderId,
      status: "pendente",
      plan: plan.id,
      amountCents: plan.priceCents,
      qrCode: pix.qrCode,
      qrBase64: pix.qrBase64,
      key: null,
      days: plan.days,
    };
  });

export const getOrder = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => ({ orderId: String(data?.orderId || "").slice(0, 64) }))
  .handler(async ({ data }): Promise<OrderView | ShopFail> => {
    const { fulfillOrder } = await import("./shop.server");
    const { getDb: getSql } = await import("./db-app.server");
    const order = await fulfillOrder(data.orderId).catch(() => null);
    if (!order) return { ok: false, error: "Pedido não encontrado." };
    const sql = await getSql();
    const rows = await sql.query<{ qr_code: string | null; qr_base64: string | null; key_plain: string | null }>(
      `select o.qr_code, o.qr_base64, k.key_plain
         from orders o left join access_keys k on k.id = o.key_id where o.id = $1`,
      [order.id],
    );
    const plan = PLANS.find((p) => p.id === order.plan);
    return {
      ok: true,
      orderId: order.id,
      status: order.status,
      plan: order.plan,
      amountCents: order.amount_cents,
      qrCode: rows[0]?.qr_code || "",
      qrBase64: rows[0]?.qr_base64 || "",
      key: order.status === "pago" ? (rows[0]?.key_plain ?? null) : null,
      days: plan?.days ?? null,
    };
  });
