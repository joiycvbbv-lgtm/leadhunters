import { ArrowLeft, BadgeCheck, Check, Clock3, Crown, Search, Sparkles, Store } from "lucide-react";

const plans = [
  {
    name: "Grátis",
    badge: "Disponível agora",
    price: "R$ 0",
    description: "Para começar a prospectar com sua conta Google.",
    features: ["3 buscas por dia", "Até 5 leads por busca", "2 gerações de IA por dia", "1 prévia de site; publicação desativada"],
    current: true,
  },
  {
    name: "30 dias",
    badge: "Em breve",
    price: "Plano futuro",
    description: "Mais volume para quem prospecta toda semana.",
    features: ["Até 30 buscas por dia", "Até 60 leads por busca", "Mais gerações de IA", "Publicação de sites"],
  },
  {
    name: "90 dias",
    badge: "Em breve",
    price: "Plano futuro",
    description: "Para manter uma rotina consistente de prospecção.",
    features: ["Até 40 buscas por dia", "Até 60 leads por busca", "Mais gerações de IA", "Publicação de sites"],
  },
  {
    name: "Vitalício",
    badge: "Em breve",
    price: "Plano futuro",
    description: "Acesso ampliado por tempo indeterminado.",
    features: ["Até 50 buscas por dia", "Até 60 leads por busca", "Mais gerações de IA", "Publicação de sites"],
  },
];

export function PlanApp() {
  return (
    <main className="min-h-screen bg-[#f4f9fd] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/app" className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm transition hover:bg-sky-50">
          <ArrowLeft className="size-4" /> Voltar ao LeadHunter
        </a>
        <header className="mx-auto max-w-2xl py-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
            <BadgeCheck className="size-4" /> Planos LeadHunter
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Escolha como quer prospectar</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Nesta fase, o plano grátis funciona com login Google. Não há cobrança nem checkout ativo.
          </p>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Planos disponíveis">
          {plans.map((plan, index) => {
            const Icon = index === 0 ? Search : index === 3 ? Crown : index === 2 ? Sparkles : Store;
            return (
              <article key={plan.name} className={`flex flex-col rounded-3xl border bg-white p-5 shadow-[0_12px_35px_-26px_rgba(15,85,130,.4)] ${plan.current ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Icon className="size-5" /></span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${plan.current ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"}`}>
                    {plan.badge}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-bold">{plan.name}</h2>
                <p className="mt-2 text-sm leading-5 text-slate-600">{plan.description}</p>
                <p className="mt-5 text-lg font-extrabold text-sky-800">{plan.price}</p>
                <ul className="mt-5 flex-1 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-700">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-sky-600" />{feature}</li>)}
                </ul>
                {plan.current ? (
                  <a href="/app" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700">
                    Entrar com Google
                  </a>
                ) : (
                  <button type="button" disabled className="mt-6 inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-500">
                    <Clock3 className="size-4" /> Sem cobrança por enquanto
                  </button>
                )}
              </article>
            );
          })}
        </section>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-slate-500">
          Os limites são validados no servidor. Os planos pagos só serão liberados quando a cobrança for ativada.
        </p>
      </div>
    </main>
  );
}
