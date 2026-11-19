import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, MapPin, MessageCircle, Search, Target } from "lucide-react";
import { PLANS, brl } from "@/lib/plans";

const features = [
  { number: "01", icon: Search, title: "Ache empresas pelo perfil", text: "Escolha a cidade e o segmento. A busca ajuda a montar uma lista inicial de negócios para abordar." },
  { number: "02", icon: Target, title: "Não perca o fio da conversa", text: "Guarde os contatos importantes e registre em que ponto está cada negociação." },
  { number: "03", icon: MessageCircle, title: "Passe da pesquisa para a ação", text: "Abra o contato pelo WhatsApp e acompanhe os próximos passos sem espalhar tudo em planilhas." },
  { number: "04", icon: BarChart3, title: "Veja o que merece atenção", text: "Tenha uma visão simples dos contatos novos, das conversas em andamento e dos retornos pendentes." },
];

const steps = [
  ["01", "Defina onde procurar", "Informe a cidade e o tipo de negócio que você quer encontrar."],
  ["02", "Revise os resultados", "Confira as informações disponíveis e salve apenas os contatos que fazem sentido."],
  ["03", "Faça o acompanhamento", "Entre em contato, registre o andamento e volte aos leads na hora certa."],
];

const faqs = [
  ["O LeadHunter encontra qualquer empresa?", "Não. Os resultados dependem da cobertura e das informações públicas disponíveis nas fontes conectadas. Alguns negócios podem aparecer sem telefone ou outros dados."],
  ["Preciso instalar o programa?", "Não. O LeadHunter funciona pelo navegador e pode ser acessado pelo computador ou celular."],
  ["O pagamento já está ativo?", "A página de compra está preparada, mas a cobrança só deve ser considerada ativa depois que as contas e credenciais dos provedores forem configuradas e testadas."],
  ["Como recebo minha licença?", "A licença é liberada depois da confirmação do pagamento pelo provedor. A página de retorno da compra, sozinha, não confirma uma cobrança."],
];

export function MarketingSite() {
  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#20251f] selection:bg-[#c9d7c4] selection:text-[#20251f]">
      <header className="relative z-20 border-b border-[#20251f]/10 bg-[#f4f2ec]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
          <Link to="/" className="flex items-center gap-3" aria-label="LeadHunter início">
            <span className="grid size-10 place-items-center rounded-full bg-[#243d31] text-[#f4f2ec]"><Target className="size-[19px]" strokeWidth={1.8} /></span>
            <span className="font-display text-[19px] font-semibold tracking-[-.06em]">lead<span className="font-normal text-[#71816d]">hunter</span></span>
          </Link>
          <nav className="hidden items-center gap-9 text-[13px] font-medium text-[#596158] md:flex">
            <a href="#produto" className="hover:text-[#243d31]">O produto</a>
            <a href="#funciona" className="hover:text-[#243d31]">Como funciona</a>
            <a href="#planos" className="hover:text-[#243d31]">Planos</a>
            <a href="#duvidas" className="hover:text-[#243d31]">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-5">
            <Link to="/app" className="hidden text-[13px] font-semibold text-[#39453b] hover:text-[#71816d] sm:inline-flex">Entrar</Link>
            <Link to="/comprar" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#243d31] px-5 text-[13px] font-semibold text-white transition hover:bg-[#365642]">Conhecer planos <ArrowUpRight className="size-4" /></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:pb-20 sm:pt-14 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[.88fr_1.12fr] lg:gap-14">
          <div className="max-w-xl">
            <p className="mb-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#71816d]"><span className="h-px w-8 bg-[#71816d]" /> Prospecção sem complicação</p>
            <h1 className="font-display text-[clamp(2.8rem,6vw,5.4rem)] font-semibold leading-[.99] tracking-[-.075em] text-[#20251f]">Encontre bons contatos. <span className="text-[#71816d]">Cuide do resto.</span></h1>
            <p className="mt-7 max-w-md text-[15px] leading-7 text-[#656b61] sm:text-base">O LeadHunter reúne busca de empresas e organização de contatos para deixar sua rotina comercial mais clara — da primeira pesquisa ao retorno.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/app" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#d1a15b] px-7 text-sm font-bold text-[#20251f] transition hover:bg-[#dfb575]">Acessar o aplicativo <ArrowRight className="size-4" /></Link>
              <a href="#produto" className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#20251f]/20 px-7 text-sm font-semibold text-[#39453b] transition hover:border-[#243d31] hover:bg-white/50">Conhecer o produto</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#20251f]/10 pt-5 text-xs text-[#687066]">
              <span className="flex items-center gap-2"><Search className="size-4 text-[#71816d]" /> Busca por cidade</span>
              <span className="flex items-center gap-2"><Target className="size-4 text-[#71816d]" /> Gestão de contatos</span>
              <span className="flex items-center gap-2"><MessageCircle className="size-4 text-[#71816d]" /> Atalho para WhatsApp</span>
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[1.14/1] overflow-hidden rounded-[2px] bg-[#d8d8cb] sm:aspect-[1.25/1]">
              <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85" alt="Equipe pequena trabalhando em uma mesa com notebook e anotações" className="h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14251d]/55 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8">
                <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/75">Sua rotina comercial</p><p className="mt-2 max-w-xs font-display text-2xl font-medium leading-tight tracking-[-.04em] sm:text-3xl">Mais organização em cada etapa.</p></div>
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-white/50 sm:flex"><ArrowUpRight className="size-5" /></span>
              </div>
            </div>
            <div className="absolute -bottom-5 left-4 max-w-[235px] border border-[#20251f]/10 bg-[#fbfaf6] p-4 shadow-[0_14px_40px_-24px_rgba(20,30,20,.35)] sm:-left-7 sm:bottom-8 sm:max-w-[245px]">
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#71816d]">Do primeiro contato ao retorno</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#39453b]"><span className="size-2 rounded-full bg-[#d1a15b]" /> Pesquisar</div>
              <div className="ml-[3px] h-3 border-l border-dashed border-[#9aa493]" />
              <div className="flex items-center gap-2 text-xs font-semibold text-[#39453b]"><span className="size-2 rounded-full bg-[#71816d]" /> Organizar</div>
              <div className="ml-[3px] h-3 border-l border-dashed border-[#9aa493]" />
              <div className="flex items-center gap-2 text-xs font-semibold text-[#39453b]"><span className="size-2 rounded-full bg-[#243d31]" /> Acompanhar</div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-[#20251f]/10 bg-[#e9e8df]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-5 py-7 sm:grid-cols-4 lg:px-10">
          {[["PESQUISA", "Cidade e segmento"], ["CONTATOS", "Informações reunidas"], ["ACOMPANHAMENTO", "Etapas organizadas"], ["ROTINA", "Tudo no mesmo lugar"]].map(([title,desc]) => <div key={title} className="border-l border-[#20251f]/15 pl-4 first:border-0 first:pl-0 sm:first:border-l sm:first:pl-4"><p className="text-[10px] font-bold tracking-[.15em] text-[#71816d]">{title}</p><p className="mt-1 text-[13px] text-[#4f584e]">{desc}</p></div>)}
        </div>
      </div>

      <section id="produto" className="mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:px-10 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div className="max-w-sm">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#71816d]">O que você encontra</p>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-.06em] sm:text-5xl">Menos abas abertas. Mais clareza.</h2>
            <p className="mt-5 text-sm leading-7 text-[#656b61]">Ferramentas diretas para apoiar a prospecção, sem transformar seu dia em uma operação complicada.</p>
            <Link to="/app" className="mt-8 inline-flex items-center gap-2 border-b border-[#243d31] pb-1 text-sm font-bold text-[#243d31]">Ver o painel <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {features.map(({ number, icon: Icon, title, text }) => <article key={number} className="border-t border-[#20251f]/20 py-7">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-widest text-[#9a9d91]">{number}</span><Icon className="size-5 text-[#71816d]" strokeWidth={1.6} /></div>
              <h3 className="mt-7 font-display text-xl font-semibold tracking-[-.04em]">{title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#656b61]">{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="funciona" className="bg-[#243d31] py-20 text-[#f4f2ec] sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.8fr_1.2fr] lg:gap-24 lg:px-10">
          <div className="max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#c6d0bd]">Como funciona</p>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-[-.06em] sm:text-5xl">Um caminho simples para começar.</h2>
            <p className="mt-5 text-sm leading-7 text-white/65">Você escolhe quem quer encontrar. O LeadHunter ajuda a organizar a pesquisa e acompanhar o trabalho depois dela.</p>
            <Link to="/app" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#d1a15b] px-6 text-sm font-bold text-[#20251f] hover:bg-[#dfb575]">Abrir LeadHunter <ArrowRight className="size-4" /></Link>
          </div>
          <div className="divide-y divide-white/20 border-y border-white/20">
            {steps.map(([number,title,desc]) => <div key={number} className="grid gap-3 py-7 sm:grid-cols-[70px_1fr] sm:gap-5">
              <span className="font-display text-2xl font-medium text-[#d1a15b]">{number}</span>
              <div><h3 className="font-display text-xl font-semibold tracking-[-.035em]">{title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-white/65">{desc}</p></div>
            </div>)}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:px-10 lg:py-28">
        <div className="flex flex-col justify-between gap-5 border-b border-[#20251f]/15 pb-8 sm:flex-row sm:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#71816d]">Planos</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Escolha o seu ritmo.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-[#656b61]">Consulte os limites e recursos de cada opção antes de finalizar a compra.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => <article key={plan.id} className={`flex flex-col border p-7 ${plan.highlight ? "border-[#243d31] bg-[#e8ebe2]" : "border-[#20251f]/15 bg-[#fbfaf6]"}`}>
            {plan.highlight && <span className="mb-5 w-fit bg-[#243d31] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-white">Em destaque</span>}
            <p className="text-sm font-semibold text-[#596158]">{plan.name}</p>
            <h3 className="mt-4 font-display text-4xl font-semibold tracking-[-.06em]">{brl(plan.priceCents)}<span className="ml-1 text-xs font-medium tracking-normal text-[#777e73]">{plan.days === null ? "pagamento único" : `/ ${plan.days} dias`}</span></h3>
            <p className="mt-3 min-h-10 text-sm leading-6 text-[#687066]">{plan.tagline}</p>
            <div className="my-6 h-px bg-[#20251f]/15" />
            <ul className="mb-8 flex-1 space-y-3 text-sm text-[#4f584e]">
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-[#71816d]" /> Até {plan.dailyLimit} leads por dia</li>
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-[#71816d]" /> CRM e organização de contatos</li>
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-[#71816d]" /> Histórico de prospecção</li>
              <li className="flex gap-2"><Check className="size-4 shrink-0 text-[#71816d]" /> Suporte e atualizações do app</li>
            </ul>
            <Link to="/comprar" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition ${plan.highlight ? "bg-[#243d31] text-white hover:bg-[#365642]" : "border border-[#243d31]/30 text-[#243d31] hover:bg-[#e8ebe2]"}`}>Escolher plano <ArrowRight className="size-4" /></Link>
          </article>)}
        </div>
        <p className="mt-5 text-xs leading-5 text-[#858a80]">Valores e limites conforme a configuração atual do aplicativo. A cobrança real depende da ativação e dos testes das contas de pagamento.</p>
      </section>

      <section className="px-5 pb-20 lg:px-10 lg:pb-24">
        <div className="mx-auto grid max-w-7xl overflow-hidden bg-[#e6e5db] md:grid-cols-[1fr_.8fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#71816d]">Comece por aqui</p>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-[-.06em] sm:text-5xl">Sua próxima lista de contatos começa com uma busca.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#656b61]">Entre no painel, escolha um segmento e veja como o LeadHunter pode se encaixar no seu processo.</p>
            <Link to="/app" className="mt-8 inline-flex min-h-14 items-center gap-3 rounded-full bg-[#243d31] px-7 text-sm font-bold text-white hover:bg-[#365642]">Ir para o painel <ArrowUpRight className="size-4" /></Link>
          </div>
          <div className="relative hidden min-h-[340px] md:block">
            <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85" alt="Profissionais conversando e trabalhando juntos em uma mesa" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section id="duvidas" className="mx-auto max-w-4xl px-5 pb-24 lg:px-10">
        <div className="border-b border-[#20251f]/15 pb-7"><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#71816d]">Dúvidas frequentes</p><h2 className="mt-4 font-display text-3xl font-semibold tracking-[-.05em] sm:text-4xl">O que você precisa saber.</h2></div>
        <div className="divide-y divide-[#20251f]/15">
          {faqs.map(([question,answer]) => <details key={question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#30382f]">{question}<ChevronDown className="size-4 shrink-0 text-[#71816d] transition group-open:rotate-180" /></summary>
            <p className="mt-3 max-w-3xl pr-8 text-sm leading-6 text-[#687066]">{answer}</p>
          </details>)}
        </div>
      </section>

      <footer className="border-t border-[#20251f]/15 bg-[#e9e8df]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <Link to="/" className="flex items-center gap-3 font-display text-lg font-semibold tracking-[-.06em]"><span className="grid size-9 place-items-center rounded-full bg-[#243d31] text-[#f4f2ec]"><Target className="size-4" /></span>lead<span className="-ml-3 font-normal text-[#71816d]">hunter</span></Link>
          <p className="text-xs text-[#777e73]">Uma ferramenta para organizar sua prospecção comercial.</p>
          <div className="flex gap-6 text-xs font-semibold text-[#596158]"><Link to="/comprar" className="hover:text-[#243d31]">Planos</Link><Link to="/app" className="hover:text-[#243d31]">Entrar</Link></div>
        </div>
      </footer>
    </main>
  );
}
