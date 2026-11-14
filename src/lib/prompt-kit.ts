import { KIND_LABELS, PRESETS, type Kind, type SiteData } from "./site-builder";

/** Transforma os dados de uma empresa num prompt profissional para colar em qualquer IA (Claude, ChatGPT, Gemini). */

export type PromptStyle = "escuro" | "claro" | "colorido" | "premium";
export type PromptFormat = "unico" | "tres" | "react" | "next";
export type PromptOptions = { style: PromptStyle; format: PromptFormat; detail: "completo" | "curto"; brief?: string };

export const PROMPT_STYLES: { id: PromptStyle; label: string; text: string }[] = [
  { id: "escuro", label: "Moderno escuro", text: "fundo escuro, contraste alto, cantos pouco arredondados, uma cor de destaque forte, sensação atual" },
  { id: "claro", label: "Claro e minimalista", text: "fundo branco ou off-white, muito espaço em branco, tipografia limpa, poucas cores" },
  { id: "colorido", label: "Colorido e vivo", text: "cores marcantes em blocos, formas arredondadas, clima amigável, sem exagero" },
  { id: "premium", label: "Premium e elegante", text: "tons sóbrios (preto, grafite, bege, dourado), títulos em fonte serifada, transições suaves e muito capricho" },
];

export const PROMPT_FORMATS: { id: PromptFormat; label: string; text: string }[] = [
  { id: "unico", label: "Um arquivo HTML (mais fácil)", text: "Entregue UM único arquivo `index.html` com CSS e JavaScript dentro dele, pronto para abrir no navegador e publicar." },
  { id: "tres", label: "3 arquivos (HTML, CSS, JS)", text: "Entregue 3 arquivos: `index.html`, `style.css` e `script.js`, cada um em um bloco de código separado, com o nome do arquivo acima do bloco." },
  { id: "react", label: "React + Vite", text: "Entregue um projeto React + Vite + Tailwind CSS com a estrutura de pastas, `package.json` e todos os arquivos em blocos de código separados (nome do arquivo acima de cada bloco), mais os comandos para instalar e rodar." },
  { id: "next", label: "Next.js", text: "Entregue um projeto Next.js (App Router) com TypeScript e Tailwind CSS, com a estrutura de pastas, `package.json` e todos os arquivos em blocos de código separados (nome do arquivo acima de cada bloco), mais os comandos para instalar e rodar." },
];

const GOALS: Record<Kind, string> = {
  burger: "fazer o cliente ver o cardápio e pedir pelo WhatsApp em poucos toques",
  restaurante: "mostrar o ambiente e o cardápio e levar o cliente a reservar ou pedir",
  cafe: "abrir o apetite com os produtos da casa e levar o cliente à loja ou a encomendar",
  barbearia: "passar estilo e fazer o cliente agendar um horário",
  salao: "transmitir cuidado e levar a cliente a agendar",
  clinica: "passar confiança e facilitar o agendamento de consultas",
  oficina: "mostrar confiança e fazer o cliente pedir um orçamento",
  fitness: "motivar e levar o cliente a marcar uma aula experimental",
  loja: "mostrar a vitrine e levar o cliente a chamar ou visitar a loja",
  servicos: "gerar confiança e pedidos de orçamento",
  generico: "apresentar o negócio e levar o cliente a entrar em contato",
};

const SECTIONS: Record<Kind, string[]> = {
  burger: ["Abertura com espaço de foto grande e botão de pedir", "Cardápio por categorias, com nome, descrição curta e preço", "Combos e promoções (só se existirem)", "Como pedir e área de entrega", "Horários e localização com mapa"],
  restaurante: ["Abertura com chamada simples e botões de reservar e ver cardápio", "Sobre a casa", "Cardápio por categorias com preços", "Galeria de fotos do ambiente", "Horários, endereço, mapa e como chegar"],
  cafe: ["Abertura com os produtos mais conhecidos", "Vitrine de produtos com descrição curta", "Encomendas e como pedir", "Sobre a casa", "Horários e localização com mapa"],
  barbearia: ["Abertura forte com botão de agendar", "Serviços e preços", "Galeria de cortes", "Equipe", "Como agendar, horários e localização"],
  salao: ["Abertura delicada com botão de agendar", "Serviços com valores a partir de", "Galeria de trabalhos", "Profissionais", "Horários e localização"],
  clinica: ["Abertura com botão de agendar", "Especialidades e tratamentos", "Sobre a clínica e a equipe (com registros profissionais, quando houver)", "Como funciona o atendimento", "Horários, endereço e mapa"],
  oficina: ["Abertura direta com botão de orçamento", "Serviços", "Como funciona (diagnóstico, orçamento, serviço, entrega)", "Marcas atendidas, se houver", "Horários e localização com mapa"],
  fitness: ["Abertura com botão de aula experimental", "Modalidades e horários das aulas", "Planos e valores, se houver", "Estrutura e professores", "Endereço e mapa"],
  loja: ["Abertura com botão de WhatsApp", "Categorias e produtos em destaque", "Promoções e novidades", "Formas de pagamento e entrega, se houver", "Horários e localização com mapa"],
  servicos: ["Abertura com a promessa principal e botão de orçamento", "Serviços oferecidos", "Como funciona, passo a passo", "Perguntas frequentes", "Contato, horários e área de atendimento"],
  generico: ["Abertura com chamada principal e botão de contato", "O que a empresa oferece", "Sobre a empresa", "Horários e localização com mapa"],
};

function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") && d.length > 11 ? d : `55${d}`;
}

export function factsBlock(site: SiteData): string[] {
  const kind = site.kind;
  const wa = waNumber(site.phone);
  const lines = [
    `- Nome: ${site.name || "[NOME DA EMPRESA]"}`,
    `- Tipo de negócio: ${KIND_LABELS[kind]}${site.category ? ` (categoria no Google: ${site.category})` : ""}`,
    `- Endereço: ${site.address || "[ADICIONAR ENDEREÇO]"}`,
    `- Cidade: ${site.city || "[ADICIONAR CIDADE]"}`,
    `- WhatsApp: ${site.phone ? `${site.phone} (link: https://wa.me/${wa})` : "[ADICIONAR WHATSAPP]"}`,
  ];
  lines.push(site.hours.length ? `- Horários:\n${site.hours.map((h) => `    • ${h}`).join("\n")}` : "- Horários: [ADICIONAR HORÁRIOS]");
  if (site.rating > 0) lines.push(`- Nota no Google: ${site.rating.toFixed(1)} de 5 (${site.reviews} avaliações)`);
  if (site.mapsUrl) lines.push(`- Link no Google Maps: ${site.mapsUrl}`);
  if (site.instagram) lines.push(`- Instagram: ${site.instagram}`);
  if (site.tagline) lines.push(`- Frase de destaque do dono: ${site.tagline}`);
  if (site.about) lines.push(`- Texto "quem somos" do dono: ${site.about}`);
  if (site.highlights.length) lines.push(`- Diferenciais confirmados:\n${site.highlights.map((h) => `    • ${h}`).join("\n")}`);
  if (site.items.length) {
    lines.push(
      `- ${PRESETS[kind].itemsTitle} confirmado pelo dono:\n${site.items
        .map((i) => `    • ${i.name}${i.desc ? ` — ${i.desc}` : ""}${i.price ? ` — ${i.price}` : ""}`)
        .join("\n")}`,
    );
  }
  return lines;
}

export function buildPrompt(site: SiteData, options: PromptOptions): string {
  const kind = site.kind;
  const preset = PRESETS[kind];
  const style = PROMPT_STYLES.find((item) => item.id === options.style) ?? PROMPT_STYLES[0];
  const format = PROMPT_FORMATS.find((item) => item.id === options.format) ?? PROMPT_FORMATS[0];
  const name = site.name.trim() || "[NOME DA EMPRESA]";
  const facts = factsBlock(site);
  const out: string[] = [];
  const add = (line = "") => out.push(line);

  if (options.detail === "curto") {
    add(`Crie o site completo de "${name}" (${KIND_LABELS[kind]}) em português do Brasil, com cara de agência profissional e não de modelo pronto de IA.`);
    add();
    add("DADOS REAIS (use exatamente, não invente nada):");
    facts.forEach((line) => add(line));
    add();
    add(`Objetivo: ${GOALS[kind]}. Botão principal: "${preset.cta}" (WhatsApp).`);
    add(`Estilo: ${style.text}. Cor principal: ${site.color}.`);
    add(`Seções: ${SECTIONS[kind].join("; ")}.`);
    add("Regras: mobile first, rápido, acessível, botão flutuante de WhatsApp, mapa incorporado e SEO local. Onde faltar informação (preços, fotos, textos), deixe marcadores [EDITAR: ...] visíveis em vez de inventar. Sem emojis como ícones, sem gradientes roxos, sem blocos de três cartões iguais.");
    add(format.text);
    return out.join("\n");
  }

  add("# PAPEL");
  add("Você é um designer e desenvolvedor front-end sênior, especialista em sites de negócios locais brasileiros. Você tem excelente senso estético, escreve bem em português do Brasil e entende de SEO local. Seus sites parecem feitos à mão por uma agência, nunca por um gerador automático.");
  add();
  add("# OBJETIVO");
  add(`Criar o site completo e pronto para publicar de "${name}". O site existe para ${GOALS[kind]}. A ação principal é "${preset.cta}", sempre pelo WhatsApp.`);
  add();
  if (options.brief?.trim()) {
    add("# BRIEFING CRIATIVO (siga esta direção)");
    add(options.brief.trim());
    add();
  }
  add("# DADOS REAIS DA EMPRESA (use exatamente como estão)");
  facts.forEach((line) => add(line));
  add();
  add("# REGRA DE OURO SOBRE INFORMAÇÕES");
  add("- Use SOMENTE os dados acima. Nunca invente preços, produtos, nomes de pessoas, depoimentos, certificações, convênios, anos de história ou números.");
  add("- Onde faltar informação, deixe um marcador visível no formato [EDITAR: o que colocar] para o dono trocar depois.");
  add("- Fotos: use espaços de imagem com borda e fundo suave, marcados como [ADICIONAR FOTO: descrição]. Não use fotos de bancos de imagem nem links externos de imagem.");
  add("- Não copie textos de avaliações de clientes. Mostre apenas a nota e a quantidade de avaliações.");
  add();
  add("# DESIGN");
  add(`- Estilo: ${style.label} — ${style.text}.`);
  add(`- Cor principal: ${site.color}. Escolha cores de apoio que combinem e respeitem contraste de acessibilidade (WCAG AA).`);
  add("- Tipografia: combine 2 fontes do Google Fonts (títulos e texto), com boa leitura no celular.");
  add("- Layout mobile first, com seções bem espaçadas, alinhamentos cuidadosos e hierarquia clara. Animações discretas ao rolar a página.");
  add("- Evite o visual de site feito por IA: sem gradientes roxos ou azuis, sem emojis como ícones, sem três cartões iguais com ícone, sem frases como 'Bem-vindo ao' ou 'soluções', sem tudo centralizado, sem sombras e brilhos exagerados.");
  add();
  add("# ESTRUTURA (nesta ordem)");
  add("0. Barra de navegação fixa com o nome da empresa, links de âncora e botão de WhatsApp.");
  SECTIONS[kind].forEach((item, index) => add(`${index + 1}. ${item}`));
  add(`${SECTIONS[kind].length + 1}. Rodapé simples com nome, endereço e ano atual.`);
  add();
  add("# FUNCIONALIDADES");
  add("- Botão flutuante de WhatsApp com mensagem inicial já preenchida (use encodeURIComponent).");
  add("- Mapa do Google incorporado por iframe (sem chave de API) e botão 'Como chegar'.");
  add("- Destaque do dia atual na lista de horários e indicador 'Aberto agora / Fechado agora' calculado no navegador.");
  add("- Rolagem suave entre seções e menu que fecha ao tocar no celular.");
  add();
  add("# SEO E LOCAL");
  add("- Título e meta description para a busca local (nome + tipo de negócio + cidade).");
  add("- Dados estruturados JSON-LD do tipo LocalBusiness com nome, telefone, endereço e horários. Não inclua avaliações nos dados estruturados.");
  add("- Uma só tag H1, hierarquia de títulos correta, textos alternativos nas imagens e tags Open Graph para compartilhar no WhatsApp.");
  add();
  add("# TÉCNICO");
  add(`- ${format.text}`);
  add("- Sem dependências desnecessárias, carregamento rápido, HTML semântico e acessível, código limpo e comentado onde o dono precisará editar.");
  add();
  add("# COMO RESPONDER");
  add("1. Entregue primeiro o código completo e funcional, sem cortar partes.");
  add("2. Depois, em no máximo 8 linhas, liste o que o dono deve editar (todos os marcadores [EDITAR] e [ADICIONAR FOTO]) e como publicar de graça (Vercel, Netlify ou GitHub Pages).");
  return out.join("\n");
}
