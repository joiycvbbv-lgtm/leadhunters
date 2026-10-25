import { getDb as getSql } from "./db-app.server";
import { createKeys } from "./keys.server";
import { PLANS } from "./plans";

const MP = "https://api.mercadopago.com";

export function mpToken() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN || "";
}

const ABACATE = "https://api.abacatepay.com/v2";

export function abacateKey() {
  return (process.env.ABACATEPAY_API_KEY || "").trim();
}

/** Qual serviço de Pix está configurado (AbacatePay tem prioridade se as duas chaves existirem). */
export function activeProvider(): "abacatepay" | "mercadopago" | null {
  if (abacateKey()) return "abacatepay";
  if (mpToken()) return "mercadopago";
  return null;
}

// Os ids do Mercado Pago são só números; os do AbacatePay começam com letras (pix_char_...).
const isAbacateId = (id: string) => !/^\d+$/.test(id);

type Charge = { ok: true; paymentId: string; qrCode: string; qrBase64: string } | { ok: false; error: string };

async function abacateCreatePix(input: { orderId: string; amountCents: number; description: string }): Promise<Charge> {
  const response = await fetch(`${ABACATE}/transparents/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${abacateKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: input.amountCents,
        expiresIn: 3600,
        description: input.description.slice(0, 37),
        externalId: input.orderId,
        metadata: { orderId: input.orderId },
      },
    }),
  });
  const json = (await response.json().catch(() => null)) as {
    data?: { id?: string; brCode?: string; brCodeBase64?: string };
    error?: string | null;
    success?: boolean;
  } | null;
  if (!response.ok || !json?.data?.id) {
    return { ok: false, error: json?.error || `AbacatePay recusou (${response.status}). Confira a chave e as permissões.` };
  }
  return {
    ok: true,
    paymentId: json.data.id,
    qrCode: json.data.brCode || "",
    // A API devolve "data:image/png;base64,...": guardamos só a parte em base64.
    qrBase64: (json.data.brCodeBase64 || "").replace(/^data:image\/[a-z]+;base64,/i, ""),
  };
}

async function abacateStatus(paymentId: string) {
  const response = await fetch(`${ABACATE}/transparents/check?id=${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${abacateKey()}` },
  });
  if (!response.ok) return null;
  const json = (await response.json().catch(() => null)) as { data?: { status?: string } } | null;
  return json?.data?.status ?? null;
}

/** Só funciona com chave de teste (modo desenvolvedor) do AbacatePay. */
export async function abacateSimulate(paymentId: string) {
  const response = await fetch(`${ABACATE}/transparents/simulate-payment?id=${encodeURIComponent(paymentId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${abacateKey()}` },
  });
  return response.ok;
}

/** Gera o Pix no serviço configurado. */
export async function createPixCharge(input: {
  orderId: string;
  amountCents: number;
  description: string;
  email: string;
  name: string;
  notificationUrl?: string;
}): Promise<Charge> {
  if (activeProvider() === "abacatepay") return abacateCreatePix(input);
  const pix = await mpCreatePix(input);
  return pix.ok ? pix : { ok: false, error: pix.error };
}

type MpPayment = {
  id?: number;
  status?: string;
  transaction_amount?: number;
  external_reference?: string;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
  message?: string;
  cause?: { description?: string }[];
};

export async function mpCreatePix(input: {
  orderId: string;
  amountCents: number;
  description: string;
  email: string;
  name: string;
  notificationUrl?: string;
}) {
  const [first, ...rest] = input.name.trim().split(/\s+/);
  const response = await fetch(`${MP}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
    },
    body: JSON.stringify({
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.orderId,
      ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
      payer: { email: input.email, first_name: first || "Cliente", last_name: rest.join(" ") || "LeadHunter" },
    }),
  });
  const payload = (await response.json().catch(() => null)) as MpPayment | null;
  if (!response.ok || !payload?.id) {
    const reason = payload?.cause?.[0]?.description || payload?.message || `Mercado Pago recusou (${response.status}).`;
    return { ok: false as const, error: reason };
  }
  const data = payload.point_of_interaction?.transaction_data;
  return {
    ok: true as const,
    paymentId: String(payload.id),
    qrCode: data?.qr_code || "",
    qrBase64: data?.qr_code_base64 || "",
  };
}

export async function mpGetPayment(paymentId: string) {
  const response = await fetch(`${MP}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${mpToken()}` },
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as MpPayment | null;
}

type OrderRow = {
  id: string;
  plan: string;
  amount_cents: number;
  buyer_name: string;
  mp_payment_id: string | null;
  status: string;
  key_id: number | null;
};

/** Cria a key do pedido pago (uma só, mesmo se duas chamadas correrem juntas). */
export async function ensureKey(orderId: string) {
  const sql = await getSql();
  const [order] = await sql.query<OrderRow>("select * from orders where id = $1", [orderId]);
  if (!order || order.status !== "pago" || order.key_id) return;
  const plan = PLANS.find((p) => p.id === order.plan);
  if (!plan) return;
  const [made] = await createKeys({
    count: 1,
    kind: "full",
    buyer: order.buyer_name,
    note: `Pedido ${order.id}`,
    dailyLimit: plan.dailyLimit,
    maxDevices: 2,
    validDays: plan.days,
  });
  if (!made) return;
  const claimed = await sql.query("update orders set key_id = $2 where id = $1 and key_id is null returning id", [
    order.id,
    made.id,
  ]);
  if (!claimed.length) await sql.query("delete from access_keys where id = $1", [made.id]);
}

/** Pergunta ao Mercado Pago se o pedido foi pago e, se sim, libera a key. */
export async function fulfillOrder(orderId: string) {
  const sql = await getSql();
  const [order] = await sql.query<OrderRow>("select * from orders where id = $1", [orderId]);
  if (!order) return null;

  if (order.status === "pendente" && order.mp_payment_id && isAbacateId(order.mp_payment_id)) {
    if (abacateKey()) {
      const status = await abacateStatus(order.mp_payment_id);
      if (status === "PAID") {
        await sql.query("update orders set status = 'pago', paid_at = now() where id = $1 and status <> 'pago'", [
          order.id,
        ]);
      } else if (status === "EXPIRED" || status === "CANCELLED") {
        await sql.query("update orders set status = 'cancelado' where id = $1 and status = 'pendente'", [order.id]);
      }
    }
  } else if (order.status === "pendente" && order.mp_payment_id) {
    const payment = await mpGetPayment(order.mp_payment_id);
    if (payment) {
      const paidOk =
        payment.status === "approved" &&
        payment.external_reference === order.id &&
        Math.round((payment.transaction_amount ?? 0) * 100) >= order.amount_cents;
      if (paidOk) {
        await sql.query("update orders set status = 'pago', paid_at = now() where id = $1 and status <> 'pago'", [
          order.id,
        ]);
      } else if (["cancelled", "rejected", "refunded", "charged_back"].includes(payment.status || "")) {
        await sql.query("update orders set status = 'cancelado' where id = $1 and status = 'pendente'", [order.id]);
      }
    }
  }
  await ensureKey(order.id);
  const [fresh] = await sql.query<OrderRow>("select * from orders where id = $1", [orderId]);
  return fresh ?? null;
}
