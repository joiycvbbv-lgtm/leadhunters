import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

function validStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + payload).digest("hex");
  return signatures.some((signature) => {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

async function handle({ request }: { request: Request }) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const signature = request.headers.get("stripe-signature") || "";
  const payload = await request.text();
  if (!validStripeSignature(payload, signature, secret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const event = JSON.parse(payload) as {
      type?: string;
      data?: { object?: {
        id?: string;
        client_reference_id?: string;
        metadata?: { order_id?: string };
        amount_total?: number;
        currency?: string;
        payment_status?: string;
      } };
    };
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data?.object;
      const orderId = session?.metadata?.order_id || session?.client_reference_id || "";
      if (orderId && session?.id) {
        const { fulfillStripeOrder } = await import("@/lib/shop.server");
        const confirmed = await fulfillStripeOrder({
          orderId,
          sessionId: session.id,
          amountTotal: Number(session.amount_total),
          currency: String(session.currency || ""),
          paymentStatus: String(session.payment_status || ""),
        });
        if (!confirmed) return new Response("Order not confirmed", { status: 400 });
      }
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

export const Route = createFileRoute("/api/stripe-webhook")({
  server: { handlers: { POST: handle } },
});
