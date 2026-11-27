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

/** Usa somente o domínio definido no servidor para callbacks de pagamento. */
function configuredAppOrigin() {
  const configured = process.env.APP_URL?.trim() || (process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : "");
  try {
    const url = new URL(configured);
    if (url.username || url.password) return "";
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) return "";
    return url.origin;
  } catch {
    return "";
  }
}

export const createPix = createServerFn({ method: "POST" })
  .validator((data: { plan: string; name: string; email: string; whatsapp: string; origin?: string; coupon?: string }) => ({
    plan: String(data?.plan || ""),
    name: String(data?.name || "").trim().slice(0, 100),
    email: String(data?.email || "").trim().toLowerCase().slice(0, 120),
    whatsapp: String(data?.whatsapp || "").replace(/\D/g, "").slice(0, 15),
    origin: String(data?.origin || ""),
    coupon: String(data?.coupon || "").slice(0, 40),
  }))
  .handler(async (): Promise<OrderView | ShopFail> => ({
    ok: false,
    error: "A cobrança está pausada. Entre com Google para ativar o plano grátis.",
  }));

export const createStripeCheckout = createServerFn({ method: "POST" })
  .validator((data: { plan: string; name: string; email: string; whatsapp: string; origin?: string; coupon?: string }) => ({
    plan: String(data?.plan || ""),
    name: String(data?.name || "").trim().slice(0, 100),
    email: String(data?.email || "").trim().toLowerCase().slice(0, 120),
    whatsapp: String(data?.whatsapp || "").replace(/\D/g, "").slice(0, 15),
    origin: String(data?.origin || ""),
    coupon: String(data?.coupon || "").slice(0, 40),
  }))
  .handler(async (): Promise<{ ok: true; orderId: string; url: string } | ShopFail> => ({
    ok: false,
    error: "A cobrança está pausada. Entre com Google para ativar o plano grátis.",
  }));

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
