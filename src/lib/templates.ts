/** Modelos de mensagem. Use {nome} (empresa) e {cidade} no texto. */
export type Template = { id: string; label: string; text: string };

export const FIRST_TEMPLATES: Template[] = [
  {
    id: "geral",
    label: "Geral",
    text: "Oi! Encontrei a {nome} no Google e não localizei um site próprio. Estou preparando ideias de sites para negócios da região, com informações, fotos e botão de WhatsApp. Posso te mandar uma prévia sem compromisso?",
  },
  {
    id: "previsualizacao",
    label: "Oferecer prévia personalizada",
    text: "Oi! Encontrei a {nome} no Google e pensei em uma forma de apresentar melhor o negócio de vocês na internet. Posso montar uma prévia de site com as informações da empresa e botão de WhatsApp para você avaliar, sem compromisso?",
  },
  {
    id: "pergunta-canal",
    label: "Começar uma conversa",
    text: "Oi! Tudo bem? Encontrei a {nome} pesquisando empresas de {segmento} em {cidade}. Hoje vocês recebem a maioria dos novos clientes pelo Instagram, indicação ou Google? Estou trabalhando com sites para negócios locais e queria entender se uma página própria faria sentido para vocês.",
  },
  {
    id: "restaurante",
    label: "Restaurante / lanchonete",
    text: "Olá! Procurei a {nome} no Google e vi que vocês ainda não têm site. Com um cardápio online e botão de pedido no WhatsApp dá para vender mais sem pagar taxa de app. Posso te mostrar um exemplo?",
  },
  {
    id: "beleza",
    label: "Salão / barbearia / estética",
    text: "Oi! Vi a {nome} aqui em {cidade} e notei que não tem site. Um site com agendamento pelo WhatsApp e fotos dos trabalhos costuma encher a agenda. Quer ver como ficaria o da {nome}?",
  },
  {
    id: "saude",
    label: "Clínica / consultório",
    text: "Olá! Encontrei a {nome} no Google, mas vocês não aparecem com site próprio. Um site passa confiança e ajuda o paciente a marcar consulta. Posso te enviar um modelo sem compromisso?",
  },
  {
    id: "loja",
    label: "Loja / comércio",
    text: "Olá! Vi que a {nome} ainda não tem site. Uma vitrine online com seus produtos e link direto para o WhatsApp ajuda a vender também fora do horário da loja. Posso te mostrar um exemplo?",
  },
  {
    id: "servicos",
    label: "Serviços (oficina, obra, limpeza)",
    text: "Olá! Procurei serviços em {cidade} e achei a {nome}, mas sem site. Quem pesquisa no Google costuma chamar quem tem site com fotos e avaliações. Posso te mostrar como ficaria o seu?",
  },
];

export const FOLLOW_TEMPLATES: Template[] = [
  {
    id: "retorno-leve",
    label: "Retorno leve",
    text: "Oi! Sou eu de novo, sobre o site da {nome}. Conseguiu dar uma olhada no que te mandei? Se quiser, tiro qualquer dúvida por aqui.",
  },
  {
    id: "retorno-proposta",
    label: "Retorno de proposta",
    text: "Olá! Passando para saber se você viu a proposta do site da {nome}. Posso ajustar o que for preciso para caber no que você precisa.",
  },
  {
    id: "retorno-ultimo",
    label: "Última tentativa",
    text: "Oi! Vou encerrar meu contato sobre o site da {nome} por aqui para não incomodar. Se mudar de ideia, é só me chamar. Obrigado pela atenção!",
  },
];

export const DEFAULT_MSG = FIRST_TEMPLATES[0].text;
export const DEFAULT_FOLLOW_MSG = FOLLOW_TEMPLATES[0].text;

/** Sugere um modelo conforme o nicho digitado na busca. */
export function suggestTemplate(niche: string): Template {
  const n = niche.toLowerCase();
  if (/restaur|lanch|pizza|hamb|bar\b|padaria|a[cç]a[ií]|sorvet|churrasc|cafe|caf[eé]/.test(n)) return FIRST_TEMPLATES[1];
  if (/sal[aã]o|barbe|est[eé]tic|unha|cabelo|manicure|spa/.test(n)) return FIRST_TEMPLATES[2];
  if (/cl[ií]nic|dent|m[eé]dic|psic|consult|fisio|veterin/.test(n)) return FIRST_TEMPLATES[3];
  if (/loja|roupa|cal[cç]ad|mercad|pet|farm[aá]c|papelar|[oó]tica/.test(n)) return FIRST_TEMPLATES[4];
  if (/oficin|mec[aâ]nic|eletric|encan|limpez|obra|pintor|reforma|chave|lava/.test(n)) return FIRST_TEMPLATES[5];
  return FIRST_TEMPLATES[0];
}

/** Janela de contato sugerida (regra prática, não é dado do Google). */
export function bestContactTime(category: string): string {
  const c = category.toLowerCase();
  if (/restaurant|food|cafe|bakery|bar|meal|pizza|lanch/.test(c)) return "14h–16h (entre almoço e jantar)";
  if (/beauty|hair|salon|spa|barber/.test(c)) return "9h–11h";
  if (/doctor|dentist|health|clinic|physio|veterin/.test(c)) return "8h–10h ou 14h–16h";
  if (/store|shop|market|clothing|pharmacy/.test(c)) return "10h–12h";
  return "9h–11h ou 14h–16h";
}


/** Mensagens internacionais: personalize e revise antes de enviar. */
export const INTERNATIONAL_TEMPLATES: Record<string, Template[]> = {
  en: [
    { id: "en-intro", label: "English · First contact", text: "Hi! I found {nome} while looking for {segmento} businesses in {cidade}. I couldn't find an official website, so I had an idea for a simple, professional page with your services, photos and a direct contact button. Would you be open to seeing a no-obligation preview?" },
    { id: "en-preview", label: "English · Offer a preview", text: "Hello! I’m reaching out because I think a professional website could make it easier for customers to find and contact {nome}. I can put together a quick concept for you to review, with no obligation. Would you like me to send it?" },
    { id: "en-follow", label: "English · Follow-up", text: "Hi! Just following up on my message about a website for {nome}. No pressure at all—would you like me to send the example, or should I close the conversation for now?" },
  ],
  es: [
    { id: "es-intro", label: "Español · Primer contacto", text: "¡Hola! Encontré {nome} buscando negocios de {segmento} en {cidade}. No encontré una página web oficial y pensé que un sitio profesional, con sus servicios, fotos y un botón de contacto, podría ayudar a sus clientes. ¿Te gustaría ver una propuesta sin compromiso?" },
    { id: "es-preview", label: "Español · Ofrecer una vista previa", text: "¡Hola! Puedo preparar una propuesta visual de sitio web para {nome}, para que veas cómo podría presentarse tu negocio en internet. Sin compromiso. ¿Te interesa?" },
    { id: "es-follow", label: "Español · Seguimiento", text: "¡Hola! Quería dar seguimiento a mi mensaje sobre el sitio web de {nome}. Si todavía te interesa, puedo enviarte un ejemplo. Si no, no hay problema. ¡Gracias!" },
  ],
  pt: [
    { id: "pt-intro", label: "Português · Primeiro contato", text: "Olá! Encontrei {nome} ao pesquisar empresas de {segmento} em {cidade}. Não encontrei um site oficial e pensei que uma página profissional, com serviços, fotos e contato direto, poderia facilitar o contato com novos clientes. Posso enviar uma prévia sem compromisso?" },
    { id: "pt-preview", label: "Português · Oferecer prévia", text: "Olá! Posso preparar uma prévia de site para {nome}, mostrando como o negócio poderia aparecer profissionalmente nas pesquisas e facilitar o contato de clientes. Gostaria de ver?" },
  ],
};
