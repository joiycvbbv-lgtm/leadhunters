import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, FileText, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";
import { SUPPORT_WHATSAPP } from "@/lib/plans";

type PageKind = "terms" | "privacy" | "support";

const pageMeta = {
  terms: { eyebrow: "Condições de uso", title: "Termos de uso", intro: "Regras para utilizar o LeadHunter com responsabilidade e transparência.", icon: FileText },
  privacy: { eyebrow: "Seus dados", title: "Privacidade", intro: "Entenda quais informações são usadas para operar a prospecção e como cuidar dos seus dados.", icon: LockKeyhole },
  support: { eyebrow: "Estamos aqui para ajudar", title: "Central de ajuda", intro: "Encontre respostas rápidas e fale com o suporte quando precisar.", icon: MessageCircle },
} satisfies Record<PageKind, { eyebrow: string; title: string; intro: string; icon: typeof FileText }>;

function Shell({ kind, children }: { kind: PageKind; children: React.ReactNode }) {
  const meta = pageMeta[kind];
  const Icon = meta.icon;
  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-8 text-[#eef2ff] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"><ArrowLeft size={16}/> Voltar ao LeadHunter</Link>
        <header className="mt-10 rounded-3xl border border-white/10 bg-white/[.055] p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200"><Icon size={22}/></div>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.2em] text-indigo-300">{meta.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-.06em] text-white sm:text-5xl">{meta.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">{meta.intro}</p>
        </header>
        <article className="mt-5 space-y-7 rounded-3xl border border-white/10 bg-white/[.035] p-6 text-sm leading-7 text-slate-300 sm:p-10">{children}</article>
        <footer className="flex flex-wrap gap-5 px-1 py-8 text-xs font-semibold text-slate-500"><Link to="/termos" className="hover:text-white">Termos</Link><Link to="/privacidade" className="hover:text-white">Privacidade</Link><Link to="/suporte" className="hover:text-white">Suporte</Link></footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-base font-extrabold text-white">{title}</h2>{children}</section>;
}

export function TermsPage() {
  return <Shell kind="terms">
    <p className="text-xs text-slate-500">Última atualização: 19 de novembro de 2026.</p>
    <Section title="1. Sobre o serviço"><p>O LeadHunter é uma ferramenta de apoio à prospecção comercial. Ela permite pesquisar empresas em fontes conectadas, visualizar informações públicas disponíveis e organizar contatos e atividades comerciais.</p></Section>
    <Section title="2. Uso responsável"><p>Você é responsável por avaliar os dados antes de entrar em contato, respeitar a legislação aplicável — incluindo regras de proteção de dados e de comunicações comerciais — e atender pedidos de não receber novas mensagens. Não use a plataforma para spam, fraude, assédio, discriminação ou atividades ilegais.</p></Section>
    <Section title="3. Dados e resultados"><p>Os dados podem estar incompletos, desatualizados ou indisponíveis. A cobertura depende das fontes conectadas, da cidade e do segmento pesquisado. O LeadHunter não garante quantidade de contatos, vendas, clientes ou resultados comerciais.</p></Section>
    <Section title="4. Licença e acesso"><p>O acesso pode depender de uma licença vinculada a limites de buscas, validade e quantidade de aparelhos. O uso de uma licença não autoriza compartilhamento não permitido, tentativa de contornar limites ou engenharia reversa do serviço.</p></Section>
    <Section title="5. Disponibilidade e alterações"><p>Recursos, limites e integrações podem mudar para correções, segurança ou melhorias. Interrupções temporárias podem ocorrer por manutenção ou indisponibilidade de serviços de terceiros.</p></Section>
    <Section title="6. Contato e identificação"><p>Antes do lançamento comercial, o responsável legal pela operação deve completar a identificação empresarial e os canais oficiais de atendimento nesta página. Nenhum dado empresarial foi inventado neste documento.</p></Section>
    <p className="border-t border-white/10 pt-5 text-xs text-slate-500">Este texto é uma base informativa e deve ser revisado por um profissional jurídico antes de ser usado como documento definitivo.</p>
  </Shell>;
}

export function PrivacyPage() {
  return <Shell kind="privacy">
    <p className="text-xs text-slate-500">Última atualização: 19 de novembro de 2026.</p>
    <Section title="1. Informações tratadas"><p>Para operar, o aplicativo pode tratar a chave de licença, identificador do aparelho, nome de perfil, preferências, histórico de pesquisas, leads salvos e registros de uso. Quando você solicita um teste, o nome e o WhatsApp informado são usados para controlar a elegibilidade e administrar o teste.</p></Section>
    <Section title="2. Dados de empresas"><p>As pesquisas podem consultar o Google Places e apresentar dados empresariais disponibilizados pela fonte, como nome, categoria, endereço, telefone, avaliações e site. A origem e a data de consulta são importantes: confirme as informações antes de usá-las.</p></Section>
    <Section title="3. Finalidades"><p>As informações são usadas para autenticar o acesso por licença, aplicar limites, sincronizar sua lista de prospecção, manter o histórico, prevenir abuso, prestar suporte e melhorar a estabilidade do serviço.</p></Section>
    <Section title="4. Armazenamento e terceiros"><p>Parte das preferências pode ficar no navegador; os dados de licença e a sincronização podem ser armazenados no banco de dados configurado pelo serviço. A pesquisa depende de provedores externos, como Google Places. A disponibilidade e as práticas desses provedores seguem seus próprios termos e políticas.</p></Section>
    <Section title="5. Seus controles"><p>Você pode exportar os leads e dados disponíveis no aplicativo. Proteja sua chave de acesso e seu aparelho. Para solicitar esclarecimentos, correção ou exclusão de informações, use a Central de ajuda; a solicitação poderá exigir confirmação de titularidade.</p></Section>
    <Section title="6. Segurança e retenção"><p>São adotadas medidas técnicas para proteger o acesso, mas nenhum sistema conectado à internet pode prometer segurança absoluta. Os dados são mantidos pelo tempo necessário à operação, segurança, cumprimento de obrigações e resolução de solicitações.</p></Section>
    <p className="border-t border-white/10 pt-5 text-xs text-slate-500">Esta página descreve o funcionamento atual em termos gerais. O responsável pela operação deve confirmar fornecedores, prazos de retenção e canal do encarregado antes do lançamento comercial.</p>
  </Shell>;
}

export function SupportPage() {
  const faqs = [
    ["Como começo uma pesquisa?", "Abra o aplicativo, informe a cidade e o segmento, ajuste os filtros e inicie a busca. Confira cada resultado antes de abordar a empresa."],
    ["Por que alguns resultados não têm telefone?", "A fonte pode não disponibilizar telefone para todos os estabelecimentos. O LeadHunter não inventa nem completa automaticamente dados ausentes."],
    ["Por que minha busca foi bloqueada?", "Cada licença tem um limite diário e pode ter validade ou limite de aparelhos. Confira o indicador de uso no painel."],
    ["Como recupero meus leads?", "Quando a sincronização em nuvem está disponível, os dados ficam vinculados à licença. Também é possível exportar a lista em CSV pela área de vendas."],
    ["Como consigo uma licença?", "A liberação de licenças e o checkout dependem da configuração comercial. Enquanto os pagamentos não estiverem ativados, o administrador pode criar e entregar licenças manualmente."],
  ];
  return <Shell kind="support">
    <Section title="Perguntas frequentes"><div className="divide-y divide-white/10">{faqs.map(([q,a])=><details key={q} className="group py-4 first:pt-0"><summary className="cursor-pointer list-none font-bold text-white marker:hidden">{q}<span className="float-right text-indigo-300 transition group-open:rotate-45">＋</span></summary><p className="mt-3 text-slate-400">{a}</p></details>)}</div></Section>
    <Section title="Fale com o suporte"><p>Se ainda precisar de ajuda, entre em contato pelo canal oficial configurado no aplicativo.</p>
      {SUPPORT_WHATSAPP ? <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-indigo-500 px-5 font-bold text-white transition hover:bg-indigo-400"><MessageCircle size={17}/> Conversar pelo WhatsApp <ArrowUpRight size={15}/></a> : <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs text-amber-100">O WhatsApp de suporte ainda não foi configurado. O responsável deve definir o canal oficial antes de divulgar o serviço.</p>}
    </Section>
    <div className="flex items-start gap-3 rounded-2xl border border-indigo-300/15 bg-indigo-400/[.06] p-4 text-xs text-slate-400"><ShieldCheck className="mt-0.5 shrink-0 text-indigo-300" size={17}/> Nunca envie sua senha, tokens ou chaves secretas de integração pelo atendimento.</div>
  </Shell>;
}
