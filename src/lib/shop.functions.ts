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
  .validator((data: { plan: string; name: string; email: string; whatsapp: string; origin?: string; coupon?: string }) => ({
    plan: String(data?.plan || ""),
    name: String(data?.name || "").trim().slice(0, 100),
    email: String(data?.email || "").trim().toLowerCase().slice(0, 120),
    whatsapp: String(data?.whatsapp || "").replace(/\D/g, "").slice(0, 15),
    origin: String(data?.origin || ""),
    coupon: String(data?.coupon || "").slice(0, 40),
  }))
  .handler(async ({ data }): Promise<OrderView | ShopFail> => {
    const plan = PLANS.find((p) => p.id === data.plan);
    if (!plan) return { ok: false, error: "Escolha um plano." };
    if (data.name.length < 3) return { ok: false, error: "Digite seu nome completo." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return { ok: false, error: "Digite um e-mail válido." };
    if (data.whatsapp.length < 10) return { ok: false, error: "Digite seu WhatsApp com DDD." };

    const { activeProvider, createPixCharge } = await import("./shop.server");
    if (!activeProvider()) {
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

    let amountCents = plan.priceCents;
    let couponCode = "";
    if (data.coupon.trim()) {
      const { resolveCoupon } = await import("./shop.server");
      const coupon = await resolveCoupon(data.coupon, plan.priceCents);
      if (!coupon.ok) return { ok: false, error: coupon.error };
      amountCents = coupon.finalCents;
      couponCode = coupon.code;
    }

    const orderId = randomUUID();
    await sql.query(
      `insert into orders (id, plan, amount_cents, buyer_name, buyer_email, buyer_whatsapp, coupon)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [orderId, plan.id, amountCents, data.name, data.email, data.whatsapp, couponCode],
    );

    const notificationUrl = /^https:\/\/[^\s/]+$/.test(data.origin) ? `${data.origin}/api/mp-webhook` : undefined;
    const pix = await createPixCharge({
      orderId,
      amountCents,
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
      amountCents,
      qrCode: pix.qrCode,
      qrBase64: pix.qrBase64,
      key: null,
      days: plan.days,
    };
  });

export const createStripeCheckout = createServerFn({ method: "POST" })
  .validator((data: { plan: string; name: string; email: string; whatsapp: string; origin?: string; coupon?: string }) => ({
    plan: String(data?.plan || ""),
    name: String(data?.name || "").trim().slice(0, 100),
    email: String(data?.email || "").trim().toLowerCase().slice(0, 120),
    whatsapp: String(data?.whatsapp || "").replace(/\D/g, "").slice(0, 15),
    origin: String(data?.origin || ""),
    coupon: String(data?.coupon || "").slice(0, 40),
  }))
  .handler(async ({ data }): Promise<{ ok: true; orderId: string; url: string } | ShopFail> => {
    const plan = PLANS.find((p) => p.id === data.plan);
    if (!plan) return { ok: false, error: "Escolha um plano." };
    if (data.name.length < 3) return { ok: false, error: "Digite seu nome completo." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return { ok: false, error: "Digite um e-mail válido." };
    if (data.whatsapp.length < 10) return { ok: false, error: "Digite seu WhatsApp com DDD." };
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secret) return { ok: false, error: "Pagamento por cartão ainda não foi configurado. Use o Pix ou volte mais tarde." };
    let origin: URL;
    try {
      origin = new URL(data.origin);
      const configuredOrigin = process.env.APP_URL?.trim() || (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "");
      if (origin.protocol !== "https:" && origin.hostname !== "localhost") throw new Error("origin");
      if (configuredOrigin && origin.origin !== new URL(configuredOrigin).origin) throw new Error("origin mismatch");
      if (process.env.NODE_ENV === "production" && !configuredOrigin) throw new Error("APP_URL missing");
    } catch {
      return { ok: false, error: "Endereço do LeadHunter inválido. Configure APP_URL nas variáveis do servidor." };
    }
    const { getDb: getSql } = await import("./db-app.server");
    const { randomUUID } = await import("node:crypto");
    const sql = await getSql();
    let amountCents = plan.priceCents;
    let couponCode = "";
    if (data.coupon.trim()) {
      const { resolveCoupon } = await import("./shop.server");
      const coupon = await resolveCoupon(data.coupon, plan.priceCents);
      if (!coupon.ok) return { ok: false, error: coupon.error };
      amountCents = coupon.finalCents;
      couponCode = coupon.code;
    }
    const orderId = randomUUID();
    await sql.query(
      "insert into orders (id, plan, amount_cents, buyer_name, buyer_email, buyer_whatsapp, coupon, provider) values ($1,$2,$3,$4,$5,$6,$7,'stripe')",
      [orderId, plan.id, amountCents, data.name, data.email, data.whatsapp, couponCode],
    );
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", origin.origin + "/comprar?pedido=" + orderId + "&checkout=success");
    params.set("cancel_url", origin.origin + "/comprar?pedido=" + orderId + "&checkout=cancel");
    params.set("client_reference_id", orderId);
    params.set("customer_email", data.email);
    params.set("metadata[order_id]", orderId);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "brl");
    params.set("line_items[0][price_data][unit_amount]", String(amountCents));
    params.set("line_items[0][price_data][product_data][name]", "LeadHunter — " + plan.name);
    params.set("line_items[0][price_data][product_data][description]", plan.dailyLimit + " buscas por dia • acesso por " + (plan.days ? plan.days + " dias" : "tempo indeterminado"));
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: "Bearer " + secret, "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const payload = await response.json().catch(() => null) as { id?: string; url?: string; error?: { message?: string } } | null;
    if (!response.ok || !payload?.id || !payload.url) {
      await sql.query("update orders set status = 'erro' where id = $1", [orderId]);
      return { ok: false, error: payload?.error?.message || "Não foi possível iniciar o checkout Stripe." };
    }
    await sql.query("update orders set stripe_session_id = $2 where id = $1", [orderId, payload.id]);
    return { ok: true, orderId, url: payload.url };
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

export const checkCoupon = createServerFn({ method: "POST" })
  .validator((data: { plan: string; code: string }) => ({
    plan: String(data?.plan || ""),
    code: String(data?.code || "").slice(0, 40),
  }))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; code: string; finalCents: number; discountCents: number; label: string } | { ok: false; error: string }> => {
      const plan = PLANS.find((p) => p.id === data.plan);
      if (!plan) return { ok: false, error: "Escolha um plano." };
      try {
        const { resolveCoupon } = await import("./shop.server");
        return await resolveCoupon(data.code, plan.priceCents);
      } catch {
        return { ok: false, error: "Não consegui conferir o cupom agora." };
      }
    },
  );
