import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Check, Copy, KeyRound, Loader2, MapPin, MessageCircle, QrCode, Radar, Target, Zap } from "lucide-react";
import { checkCoupon, createPix, getOrder, type OrderView } from "@/lib/shop.functions";
import { PLANS, SUPPORT_WHATSAPP, brl } from "@/lib/plans";

const card = "rounded-2xl border border-border bg-surface shadow-card";
const field =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-fg outline-none placeholder:text-muted/70 focus:border-primary";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary-deep font-semibold text-primary-fg shadow-[0_6px_16px_-6px_rgba(29,111,224,0.6)] transition hover:brightness-105 disabled:opacity-60";
const ORDER = "lh_order";

const BENEFITS = [
  [Radar, "Empresas sem site, com telefone", "Busque por cidade e nicho e veja só quem ainda não tem site."],
  [Zap, "Abertas agora e prioridade", "Veja quem está aberta e quem tem mais chance de fechar."],
  [MessageCircle, "WhatsApp com mensagem pronta", "Modelos por nicho e mensagens de retorno."],
  [MapPin, "Pipeline na nuvem", "Seus leads e vendas salvos, no celular e no computador."],
] as const;

export function ShopApp() {
  const [planId, setPlanId] = useState("trimestral");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [copied, setCopied] = useState("");
  const [couponText, setCouponText] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; finalCents: number; label: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  const refresh = useCallback(async (orderId: string) => {
    const result = await getOrder({ data: { orderId } }).catch(() => null);
    if (result?.ok) setOrder(result);
    else if (result && !result.ok) {
      localStorage.removeItem(ORDER);
      setOrder(null);
    }
  }, []);

  // Retoma um pedido aberto (link ?pedido=... ou o último desta tela).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("pedido");
    const saved = fromUrl || localStorage.getItem(ORDER);
    if (saved) void refresh(saved);
  }, [refresh]);

  // Confere o pagamento a cada 4 segundos enquanto o Pix está pendente.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (order && order.status === "pendente") {
      timer.current = setInterval(() => void refresh(order.orderId), 4000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [order, refresh]);

  async function pay() {
    setError("");
    setBusy(true);
    try {
      const result = await createPix({
        data: { plan: planId, name, email, whatsapp, origin: window.location.origin, coupon: coupon?.code ?? "" },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      localStorage.setItem(ORDER, result.orderId);
      setOrder(result);
    } catch {
      setError("Não consegui gerar o Pix agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function applyCoupon() {
    setCouponMsg("");
    const res = await checkCoupon({ data: { plan: planId, code: couponText } }).catch(() => null);
    if (res?.ok) {
      setCoupon({ code: res.code, finalCents: res.finalCents, label: res.label });
      setCouponMsg(`Cupom aplicado: ${res.label}.`);
    } else {
      setCoupon(null);
      setCouponMsg(res?.error ?? "Não consegui conferir o cupom.");
    }
  }

  function copy(text: string, id: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(id);
        setTimeout(() => setCopied(""), 1800);
      })
      .catch(() => undefined);
  }

  const paidPlan = order ? (PLANS.find((p) => p.id === order.plan) ?? plan) : plan;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary-deep text-primary-fg shadow-[0_8px_20px_-8px_rgba(29,111,224,0.7)]">
            <Target className="size-5" />
          </div>
          <span className="font-display text-lg font-semibold">LeadHunter</span>
        </a>
        <a href="/" className="text-sm font-semibold text-primary hover:underline">
          Já tenho uma key
        </a>
      </header>

      {order?.status === "pago" ? (
        <section className={`fade-up p-6 text-center sm:p-8 ${card}`}>
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <BadgeCheck className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Pagamento confirmado!</h1>
          {order.key ? (
            <>
              <p className="mt-2 text-muted">Esta é a sua key de acesso. Guarde bem.</p>
              <div className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-xl border border-primary/40 bg-primary-soft p-3">
                <KeyRound className="size-5 shrink-0 text-primary" />
                <code className="flex-1 break-all font-mono text-lg font-bold tracking-wider">{order.key}</code>
                <button
                  type="button"
                  onClick={() => copy(order.key!, "key")}
                  className="rounded-lg bg-surface p-2 text-primary"
                  aria-label="Copiar key"
                >
                  {copied === "key" ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
              <p className="mt-3 text-sm text-muted">
                {paidPlan.days ? `Vale por ${paidPlan.days} dias a partir do primeiro login.` : "Acesso vitalício."} Você
                pode usar em até 2 aparelhos.
              </p>
              <a href="/" className={`mt-6 h-12 px-8 ${btnPrimary}`}>
                Entrar no painel
              </a>
              <p className="mt-4 text-xs text-muted">
                Se perder a key, abra este link de novo: ele mostra a key deste pedido.
              </p>
            </>
          ) : (
            <p className="mt-3 flex items-center justify-center gap-2 text-muted">
              <Loader2 className="size-4 animate-spin" /> Liberando sua key…
            </p>
          )}
        </section>
      ) : order?.status === "pendente" ? (
        <section className={`fade-up p-6 text-center sm:p-8 ${card}`}>
          <h1 className="font-display text-2xl font-semibold">Pague com Pix</h1>
          <p className="mt-1 text-muted">
            {brl(order.amountCents)} · plano {paidPlan.name}
          </p>
          {order.qrBase64 ? (
            <img
              alt="QR Code do Pix"
              className="mx-auto mt-5 size-56 rounded-xl border border-border bg-white p-2"
              src={`data:image/png;base64,${order.qrBase64}`}
            />
          ) : (
            <QrCode className="mx-auto mt-5 size-16 text-muted" />
          )}
          {order.qrCode && (
            <div className="mx-auto mt-5 max-w-md text-left">
              <p className="mb-1.5 text-sm font-semibold">Pix copia e cola</p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-2">
                <code className="line-clamp-2 flex-1 break-all text-xs text-muted">{order.qrCode}</code>
                <button
                  type="button"
                  onClick={() => copy(order.qrCode, "pix")}
                  className={`${btnPrimary} shrink-0 px-3 py-2 text-sm`}
                >
                  {copied === "pix" ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied === "pix" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
          )}
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Aguardando o pagamento… a key aparece aqui sozinha.
          </p>
        </section>
      ) : (
        <>
          <section className="fade-up mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Painel de prospecção</p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Ache empresas sem site e venda sites todos os dias
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Busque por cidade e nicho, veja quem está aberta agora, chame no WhatsApp e acompanhe cada venda num só lugar.
            </p>
          </section>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map(([Icon, title, text]) => (
              <div key={title} className={`flex gap-3 p-4 ${card}`}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mb-3 font-display text-xl font-semibold">Escolha seu plano</h2>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {PLANS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPlanId(item.id);
                  setCoupon(null);
                  setCouponMsg("");
                }}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  planId === item.id
                    ? "border-primary bg-primary-soft shadow-card ring-2 ring-primary/40"
                    : "border-border bg-surface hover:border-primary/50"
                }`}
              >
                {item.highlight && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-fg">
                    Mais escolhido
                  </span>
                )}
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{brl(item.priceCents)}</p>
                <p className="mt-1 text-xs text-muted">{item.tagline}</p>
                <p className="mt-2 text-xs text-muted">{item.dailyLimit} buscas por dia</p>
              </button>
            ))}
          </div>

          <form
            className={`space-y-3 p-5 ${card}`}
            onSubmit={(event) => {
              event.preventDefault();
              void pay();
            }}
          >
            <h2 className="font-display text-xl font-semibold">Seus dados</h2>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className={field} autoComplete="name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" type="email" className={field} autoComplete="email" />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp com DDD" inputMode="tel" className={field} autoComplete="tel" />
            <div className="flex gap-2">
              <input
                value={couponText}
                onChange={(e) => {
                  setCouponText(e.target.value.toUpperCase());
                  setCoupon(null);
                  setCouponMsg("");
                }}
                placeholder="Tem cupom de desconto?"
                className={field}
              />
              <button type="button" onClick={() => void applyCoupon()} disabled={!couponText.trim()} className="shrink-0 rounded-xl border border-border bg-surface px-4 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50">
                Aplicar
              </button>
            </div>
            {couponMsg && <p className={`text-sm font-medium ${coupon ? "text-primary" : "text-danger"}`}>{couponMsg}</p>}
            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
            <button type="submit" disabled={busy} className={`h-12 w-full ${btnPrimary}`}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
              Pagar {brl(coupon ? coupon.finalCents : plan.priceCents)} com Pix
            </button>
            <p className="text-center text-xs text-muted">A key chega na tela assim que o Pix for confirmado.</p>
          </form>
        </>
      )}

      {SUPPORT_WHATSAPP && (
        <p className="mt-8 text-center text-sm text-muted">
          Dúvidas?{" "}
          <a
            className="font-semibold text-primary"
            target="_blank"
            rel="noreferrer"
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
          >
            Fale no WhatsApp
          </a>
        </p>
      )}
    </main>
  );
}
