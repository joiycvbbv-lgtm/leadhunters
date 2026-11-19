import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, MapPin, MessageCircle, Search, Target, Users, Sparkles, ShieldCheck, Zap, Star } from "lucide-react";
import { PLANS, brl } from "@/lib/plans";

const demoLeads = [
  { initials: "CC", name: "Café & Companhia", category: "Cafeteria", city: "Belo Horizonte, MG", state: "Novo" },
  { initials: "SF", name: "Studio Forma", category: "Estética", city: "Contagem, MG", state: "Na lista" },
  { initials: "CJ", name: "Casa do Jardim", category: "Paisagismo", city: "Betim, MG", state: "Na lista" },
];
const features = [
  [Search, "Pesquisa por região", "Encontre empresas por cidade e segmento, com os dados públicos disponíveis em cada busca."],
  [Users, "Seleção inteligente", "Revise os resultados e mantenha em foco os negócios que combinam com sua oferta."],
  [MessageCircle, "Contato mais rápido", "Abra uma conversa pelo WhatsApp quando houver telefone disponível no cadastro."],
  [Clock3, "Acompanhamento", "Organize seus contatos, registre retornos e acompanhe o andamento da prospecção."],
];
const faq = [
  ["De onde vêm os dados?", "Os resultados dependem das fontes conectadas e das informações públicas disponíveis. A cobertura varia por cidade e segmento, e alguns registros podem não ter telefone."],
  ["O LeadHunter garante novos clientes?", "Não. A ferramenta ajuda a pesquisar e organizar possíveis contatos. Os resultados dependem da sua oferta, abordagem e acompanhamento."],
  ["Posso usar pelo celular?", "Sim. O aplicativo funciona pelo navegador e adapta a interface para celular e computador."],
  ["Como recebo a licença?", "A licença deve ser liberada após a confirmação do pagamento pelo provedor. A cobrança precisa estar configurada e testada para funcionar."],
];
function Mark() {
  return <span className="grid size-10 place-items-center rounded-2xl border border-indigo-300/30 bg-indigo-400/15 text-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,.22)]"><Target size={19}/></span>;
}
const glass = "border border-white/15 bg-white/[0.075] shadow-[0_24px_80px_-42px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.13)] backdrop-blur-2xl";

export function MarketingSite() {
  return <main className="marketing-site relative min-h-screen overflow-hidden bg-[#0b1020] text-[#eef2ff] selection:bg-indigo-400/30">
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-48 size-[34rem] rounded-full bg-indigo-600/20 blur-[120px]"/>
      <div className="absolute right-[-10rem] top-[24rem] size-[30rem] rounded-full bg-sky-500/10 blur-[120px]"/>
      <div className="absolute bottom-[-12rem] left-[35%] size-[32rem] rounded-full bg-violet-600/10 blur-[130px]"/>
      <div className="absolute inset-0 opacity-[.12]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)",backgroundSize:"64px 64px",maskImage:"linear-gradient(to bottom,black,transparent 75%)"}}/>
    </div>

    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1020]/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 lg:px-10">
        <Link to="/" className="flex items-center gap-3"><Mark/><span className="text-[19px] font-extrabold tracking-[-.07em]">lead<span className="font-medium text-indigo-300">hunter</span></span></Link>
        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-slate-400 md:flex"><a className="transition hover:text-white" href="#recursos">Recursos</a><a className="transition hover:text-white" href="#como-funciona">Como funciona</a><a className="transition hover:text-white" href="#planos">Planos</a><a className="transition hover:text-white" href="#duvidas">Dúvidas</a></nav>
        <div className="flex items-center gap-3"><Link to="/app" className="hidden px-3 py-3 text-[13px] font-bold text-slate-300 transition hover:text-white sm:inline-flex">Entrar</Link><Link to="/app" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-300/30 bg-indigo-500 px-4 text-[13px] font-extrabold text-white shadow-[0_8px_28px_-12px_rgba(99,102,241,.8)] transition hover:-translate-y-0.5 hover:bg-indigo-400">Abrir aplicativo <ArrowUpRight size={15}/></Link></div>
      </div>
    </header>

    <section className="relative isolate">
      <div className="mx-auto max-w-[1280px] px-5 pb-14 pt-16 sm:pt-24 lg:px-10 lg:pb-20 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-10">
          <div className="relative z-10 max-w-[590px]">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-300/25 bg-indigo-400/[.09] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-300 opacity-50"/><span className="relative inline-flex size-2 rounded-full bg-indigo-300"/></span>
              Plataforma de prospecção comercial
            </div>
            <h1 className="max-w-[620px] text-[clamp(3.2rem,6.5vw,6.3rem)] font-extrabold leading-[.94] tracking-[-.078em] text-white">
              Menos procura. <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">Mais oportunidades.</span>
            </h1>
            <p className="mt-7 max-w-[470px] text-[15px] leading-[1.9] text-slate-400 sm:text-base">
              Encontre empresas por cidade e segmento, organize seus contatos e acompanhe cada oportunidade em um só lugar.
            </p>
            <div className="mt-9 flex flex-col gap-3 min-[430px]:flex-row">
              <Link to="/app" className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-xl bg-indigo-500 px-6 text-sm font-extrabold text-white shadow-[0_12px_34px_-14px_rgba(99,102,241,.85)] transition hover:-translate-y-0.5 hover:bg-indigo-400">Explorar LeadHunter <ArrowRight size={17}/></Link>
              <a href="#planos" className="inline-flex min-h-[54px] items-center justify-center rounded-xl border border-white/15 bg-white/[.045] px-6 text-sm font-bold text-slate-200 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[.09]">Ver planos e recursos</a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-indigo-300"/> Você escolhe quem abordar</span>
              <span className="inline-flex items-center gap-2"><Zap size={14} className="text-sky-300"/> Pesquisa e organização no mesmo painel</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[680px] lg:ml-auto">
            <div aria-hidden className="absolute -inset-7 rounded-[3rem] bg-gradient-to-br from-indigo-500/25 via-violet-500/10 to-sky-500/20 blur-3xl"/>
            <div aria-hidden className="absolute -right-6 top-12 size-28 rounded-full border border-indigo-300/15 bg-indigo-400/[.04] blur-[1px]"/>
            <div className={`relative overflow-hidden rounded-[28px] ${glass}`}>
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3"><Mark/><div><p className="text-[13px] font-extrabold text-white">Visão geral</p><p className="mt-0.5 text-[10px] text-slate-500">Seu espaço de prospecção</p></div></div>
                <span className="rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-[9px] font-extrabold tracking-[.12em] text-indigo-200">PRÉVIA DO PRODUTO</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 p-4 sm:gap-3 sm:p-5">
                {[["BUSCAS","12","pesquisas realizadas"],["SALVOS","48","empresas na lista"],["RETORNOS","06","para acompanhar"]].map(([label,value,note],i)=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.055] p-3 sm:p-4"><p className="text-[9px] font-extrabold tracking-[.13em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-[-.06em] text-white">{value}</p><p className={`mt-1 text-[9px] ${i===0?"text-indigo-300":"text-slate-500"}`}>{note}</p></div>)}
              </div>
              <div className="flex items-center justify-between px-4 pb-3 sm:px-5"><div><p className="text-[12px] font-extrabold text-white">Resultados da pesquisa</p><p className="mt-1 text-[10px] text-slate-500">Exemplo ilustrativo de empresas</p></div><span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.045] px-2.5 py-2 text-[9px] font-bold text-slate-300"><MapPin size={11} className="text-indigo-300"/> Minas Gerais</span></div>
              <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">{demoLeads.map((lead,i)=><div key={lead.name} className="flex items-center gap-3 rounded-2xl border border-white/[.09] bg-[#111a30]/70 px-3 py-3 transition hover:border-indigo-300/25 hover:bg-white/[.07]"><span className={`grid size-10 shrink-0 place-items-center rounded-xl border text-[10px] font-extrabold ${i===0?"border-amber-300/20 bg-amber-300/10 text-amber-200":i===1?"border-indigo-300/20 bg-indigo-300/10 text-indigo-200":"border-sky-300/20 bg-sky-300/10 text-sky-200"}`}>{lead.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold text-slate-100">{lead.name}</p><p className="mt-1 truncate text-[9px] text-slate-500">{lead.category} · {lead.city}</p></div><span className="hidden rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-bold text-slate-400 sm:inline-flex">{lead.state}</span><ArrowUpRight size={14} className="text-slate-500"/></div>)}</div>
              <div className="flex items-center gap-2 border-t border-white/10 bg-white/[.025] px-5 py-3 text-[9px] text-slate-500"><span className="size-1.5 rounded-full bg-indigo-300"/> Dados e números fictícios para demonstração visual</div>
            </div>
            <div className={`absolute -bottom-7 -left-3 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex ${glass}`}><span className="grid size-9 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"><Check size={17}/></span><div><p className="text-[10px] font-extrabold text-white">Fluxo organizado</p><p className="mt-1 text-[9px] text-slate-500">Da busca ao acompanhamento</p></div></div>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Recursos do LeadHunter" className="relative border-y border-white/10 bg-white/[.025] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-8 gap-y-4 px-5 py-7 lg:justify-between lg:px-10">
        <p className="w-full text-center text-[9px] font-extrabold uppercase tracking-[.2em] text-slate-600 lg:w-auto lg:text-left">Tudo em um só fluxo</p>
        {[{Icon:Search,label:"Pesquisa por cidade"},{Icon:Target,label:"Filtros por segmento"},{Icon:Users,label:"Leads organizados"},{Icon:MessageCircle,label:"Atalho para contato"},{Icon:Clock3,label:"Histórico e retornos"}].map(({Icon,label})=><span key={label} className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400"><Icon size={15} className="text-indigo-300"/>{label}</span>)}
      </div>
    </section>

    <section id="recursos" className="relative mx-auto max-w-[1280px] px-5 py-20 sm:py-28 lg:px-10"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-24"><div className="max-w-[390px]"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-300">Feito para sua rotina comercial</p><h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.06em] text-white sm:text-5xl">Da pesquisa ao próximo contato.</h2><p className="mt-5 text-sm leading-7 text-slate-400">Menos abas abertas. Mais clareza para encontrar empresas relevantes e manter cada oportunidade organizada.</p><Link to="/app" className="mt-8 inline-flex items-center gap-2 border-b border-indigo-300/50 pb-2 text-[13px] font-extrabold text-indigo-200 transition hover:text-white">Conhecer o painel <ArrowUpRight size={15}/></Link></div><div className="grid gap-3 sm:grid-cols-2">{features.map(([Icon,title,desc])=><article key={title} className={`rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-300/25 hover:bg-white/[.09] ${glass}`}><span className="grid size-11 place-items-center rounded-xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200"><Icon size={19}/></span><h3 className="mt-5 text-[16px] font-extrabold tracking-[-.035em] text-white">{title}</h3><p className="mt-2 text-[13px] leading-6 text-slate-400">{desc}</p></article>)}</div></div></section>

    <section id="como-funciona" className="relative border-y border-white/10 bg-gradient-to-br from-[#151d38]/95 via-[#121a30]/95 to-[#102235]/95"><div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:gap-24 lg:px-10"><div className="max-w-[410px]"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-300">Como funciona</p><h2 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.06em] text-white sm:text-5xl">Uma rotina comercial mais organizada.</h2><p className="mt-5 text-sm leading-7 text-slate-400">Um processo simples para pesquisar, selecionar e acompanhar possíveis clientes sem se perder entre várias ferramentas.</p></div><div className="border-t border-white/15">{[["01","Escolha o segmento","Defina o tipo de empresa e a cidade onde deseja prospectar."],["02","Confira os resultados","Analise os dados disponíveis e salve os negócios que fazem sentido."],["03","Faça o acompanhamento","Entre em contato e mantenha atualizado o andamento de cada oportunidade."]].map(([n,t,d])=><div key={n} className="grid grid-cols-[42px_1fr] gap-4 border-b border-white/15 py-7 sm:grid-cols-[64px_1fr] sm:gap-6"><span className="text-2xl font-extrabold tracking-[-.06em] text-indigo-300">{n}</span><div><h3 className="text-[16px] font-extrabold text-white">{t}</h3><p className="mt-2 max-w-lg text-[13px] leading-6 text-slate-400">{d}</p></div></div>)}</div></div></section>

    <section id="planos" className="relative mx-auto max-w-[1280px] px-5 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/[.08] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-200"><Sparkles size={13}/> Planos LeadHunter</p>
        <h2 className="mt-5 text-4xl font-extrabold tracking-[-.065em] text-white sm:text-5xl">Escolha o ritmo da sua prospecção.</h2>
        <p className="mt-4 text-[14px] leading-7 text-slate-400">Comece com o período que faz sentido para o seu negócio. Sem mensalidade escondida e com os limites apresentados antes da compra.</p>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2 text-[11px] font-semibold text-slate-300"><ShieldCheck size={14} className="text-indigo-300"/> Valores em reais · escolha por período</div>
      </div>
      <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3 md:gap-4 lg:gap-5">
        {PLANS.map((plan, index)=><article key={plan.id} className={`group relative flex min-h-full flex-col overflow-hidden rounded-[26px] p-6 transition duration-300 hover:-translate-y-2 sm:p-7 ${plan.highlight? "z-10 border border-indigo-300/45 bg-gradient-to-b from-[#242653]/95 via-[#171d38]/95 to-[#111a30]/95 shadow-[0_28px_90px_-38px_rgba(99,102,241,.5),inset_0_1px_0_rgba(255,255,255,.18)] md:scale-[1.035]" : "border border-white/12 bg-white/[.055] shadow-[0_24px_70px_-48px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-2xl"}`}>
          <div aria-hidden className={`pointer-events-none absolute -right-16 -top-20 size-48 rounded-full blur-[70px] transition-opacity duration-300 group-hover:opacity-100 ${plan.highlight?"bg-indigo-400/25":"bg-sky-400/10 opacity-60"}`}/>
          {plan.highlight&&<div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-200/25 bg-indigo-400/15 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-indigo-100"><Star size={11} fill="currentColor"/> Mais escolhido</div>}
          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center gap-2"><span className={`grid size-9 place-items-center rounded-xl border ${plan.highlight?"border-indigo-200/25 bg-indigo-300/15 text-indigo-200":"border-white/10 bg-white/[.06] text-slate-300"}`}>{index===0?<Zap size={16}/>:index===1?<Target size={16}/>:<ShieldCheck size={16}/>}</span><p className="text-[13px] font-extrabold tracking-wide text-slate-200">{plan.name}</p></div>
            <p className="mt-5 min-h-10 text-[12px] leading-5 text-slate-400">{plan.tagline}</p>
            <div className="mt-5 flex items-end gap-2"><span className="text-[clamp(2.3rem,4vw,3.1rem)] font-extrabold leading-none tracking-[-.075em] text-white">{brl(plan.priceCents)}</span><span className="pb-1.5 text-[10px] font-semibold text-slate-500">{plan.days===null?"pagamento único":`por ${plan.days} dias`}</span></div>
            <div className="mt-5 h-px bg-gradient-to-r from-white/15 via-white/10 to-transparent"/>
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">O que está incluído</p>
            <ul className="mt-4 flex-1 space-y-3.5 text-[12px] leading-5 text-slate-300">
              <li className="flex gap-2.5"><Check size={15} className="mt-0.5 shrink-0 text-indigo-300"/> Até <strong className="text-white">{plan.dailyLimit} leads por dia</strong></li>
              <li className="flex gap-2.5"><Check size={15} className="mt-0.5 shrink-0 text-indigo-300"/> Organização de contatos e oportunidades</li>
              <li className="flex gap-2.5"><Check size={15} className="mt-0.5 shrink-0 text-indigo-300"/> Histórico de prospecção</li>
              <li className="flex gap-2.5"><Check size={15} className="mt-0.5 shrink-0 text-indigo-300"/> Acesso ao painel LeadHunter</li>
            </ul>
            <Link to="/comprar" className={`mt-8 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-extrabold transition duration-200 hover:-translate-y-0.5 ${plan.highlight?"bg-indigo-500 text-white shadow-[0_12px_30px_-12px_rgba(99,102,241,.85)] hover:bg-indigo-400":"border border-white/15 bg-white/[.07] text-white hover:border-indigo-300/35 hover:bg-indigo-400/10"}`}>Escolher este plano <ArrowRight size={15}/></Link>
            <p className="mt-4 text-center text-[10px] leading-5 text-slate-500">{plan.days===null?"Acesso sem renovação.":"Acesso pelo período contratado."}</p>
          </div>
        </article>)}
      </div>
      <p className="mt-8 text-center text-[10px] leading-5 text-slate-500">Os valores e limites são os cadastrados atualmente no aplicativo. A disponibilidade da compra depende da configuração dos provedores de pagamento.</p>
    </section>

    <section className="px-5 pb-20 lg:px-10 lg:pb-24"><div className={`mx-auto flex max-w-[1280px] flex-col justify-between gap-8 rounded-[26px] p-8 sm:p-12 lg:flex-row lg:items-center lg:p-16 ${glass}`}><div className="max-w-[590px]"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-300">Seu próximo passo</p><h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-.06em] text-white sm:text-5xl">Sua próxima oportunidade pode começar com uma pesquisa.</h2><p className="mt-4 max-w-md text-[13px] leading-6 text-slate-400">Acesse o painel, explore os recursos e organize sua prospecção.</p></div><Link to="/app" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-xl bg-indigo-500 px-7 text-[13px] font-extrabold text-white shadow-[0_12px_34px_-14px_rgba(99,102,241,.8)] transition hover:-translate-y-0.5 hover:bg-indigo-400">Acessar LeadHunter <ArrowUpRight size={16}/></Link></div></section>

    <section id="duvidas" className="mx-auto max-w-[900px] px-5 pb-24 lg:px-10"><div className="border-b border-white/10 pb-7"><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-300">Perguntas frequentes</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.06em] text-white sm:text-4xl">Antes de começar.</h2></div><div className="divide-y divide-white/10">{faq.map(([q,a])=><details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-extrabold text-slate-100">{q}<ChevronDown size={17} className="shrink-0 text-indigo-300 transition group-open:rotate-180"/></summary><p className="mt-3 max-w-[760px] pr-8 text-[13px] leading-6 text-slate-400">{a}</p></details>)}</div></section>

    <footer className="border-t border-white/10 bg-black/15"><div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10"><Link to="/" className="flex items-center gap-3"><Mark/><span className="text-[16px] font-extrabold tracking-[-.075em]">lead<span className="font-medium text-indigo-300">hunter</span></span></Link><p className="text-[11px] text-slate-500">Ferramentas para pesquisar e organizar sua prospecção.</p><div className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-bold text-slate-400"><Link to="/app" className="hover:text-white">Entrar</Link><Link to="/comprar" className="hover:text-white">Planos</Link><Link to="/suporte" className="hover:text-white">Suporte</Link><Link to="/termos" className="hover:text-white">Termos</Link><Link to="/privacidade" className="hover:text-white">Privacidade</Link></div></div></footer>
  </main>;
}
