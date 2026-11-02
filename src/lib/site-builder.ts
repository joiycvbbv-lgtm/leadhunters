/**
 * Gerador de sites do LeadHunter.
 * Recebe os dados da empresa (e as fotos enviadas pelo cliente) e devolve um site completo em um único HTML.
 * Roda no navegador (prévia) e no servidor (publicação), sempre com todo texto escapado.
 */

export type Kind =
  | "burger"
  | "restaurante"
  | "cafe"
  | "barbearia"
  | "salao"
  | "clinica"
  | "oficina"
  | "fitness"
  | "loja"
  | "servicos"
  | "generico";

export type DesignId = "editorial" | "urbano" | "limpo" | "vitrine";

export type SiteItem = { name: string; desc: string; price: string };

export type SiteData = {
  name: string;
  tagline: string;
  phone: string;
  address: string;
  city: string;
  category: string;
  rating: number;
  reviews: number;
  showRating: boolean;
  mapsUrl: string;
  instagram: string;
  hours: string[];
  about: string;
  highlights: string[];
  items: SiteItem[];
  photos: string[];
  logo: string;
  kind: Kind;
  design: DesignId;
  color: string;
};

export const EMPTY_SITE: SiteData = {
  name: "",
  tagline: "",
  phone: "",
  address: "",
  city: "",
  category: "",
  rating: 0,
  reviews: 0,
  showRating: true,
  mapsUrl: "",
  instagram: "",
  hours: [],
  about: "",
  highlights: [],
  items: [],
  photos: [],
  logo: "",
  kind: "generico",
  design: "limpo",
  color: "#1d6fe0",
};

/* ---------------- Tipo de negócio ---------------- */

const RULES: [Kind, RegExp][] = [
  ["burger", /hamb[uú]rg|burger|lanchonete|hot ?dog|lanche/i],
  ["cafe", /caf[eé]|padaria|confeit|doceria|sorvet|a[cç]a[ií]|bakery|ice ?cream|bolo/i],
  ["restaurante", /restaurant|pizz|churrasc|marmit|comida|espet|sushi|japon|food|meal|bar\b|buffet/i],
  ["barbearia", /barbe/i],
  ["salao", /sal[aã]o|beleza|est[eé]tic|unha|manicure|spa\b|cabelei|hair|beauty|depila|sobrancel|lash|tatuag/i],
  ["clinica", /cl[ií]nic|dent|m[eé]dic|psic|fisio|nutri|veterin|sa[uú]de|health|doctor|laborat|[oó]tica|odonto/i],
  ["oficina", /oficin|mec[aâ]nic|lava ?jato|borrach|funilar|car[_ ]repair|car[_ ]wash|pneu|auto ?pe[cç]|auto el[eé]tr/i],
  ["fitness", /academia|crossfit|pilates|yoga|gym|fitness|dan[cç]a|nata[cç]/i],
  ["loja", /loja|store|shop|boutique|roupa|cal[cç]ad|papelar|floricult|mercad|joalher|brinquedo|pet ?shop|presente/i],
  ["servicos", /servi[cç]|eletric|encan|pintor|chave|dedetiz|contab|advog|imobili|gr[aá]fic|foto|transport|limpez|mudan|constru|marcen/i],
];

export function detectKind(...texts: string[]): Kind {
  const joined = texts.join(" ");
  for (const [kind, pattern] of RULES) if (pattern.test(joined)) return kind;
  return "generico";
}

export const KIND_LABELS: Record<Kind, string> = {
  burger: "Hamburgueria / lanchonete",
  restaurante: "Restaurante / pizzaria / bar",
  cafe: "Padaria / café / doceria / sorveteria",
  barbearia: "Barbearia",
  salao: "Salão / estética / unhas",
  clinica: "Clínica / saúde / pet",
  oficina: "Oficina / lava jato / autopeças",
  fitness: "Academia / estúdio / aulas",
  loja: "Loja / comércio",
  servicos: "Serviços em geral",
  generico: "Outro tipo de negócio",
};

export const DESIGNS: { id: DesignId; label: string; desc: string }[] = [
  { id: "editorial", label: "Editorial", desc: "Claro, com título em serifa. Combina com restaurante, café e salão." },
  { id: "urbano", label: "Urbano", desc: "Escuro e forte, letras condensadas. Combina com hamburgueria, barbearia e oficina." },
  { id: "limpo", label: "Limpo", desc: "Branco e moderno. Combina com clínica, serviços e escritórios." },
  { id: "vitrine", label: "Vitrine", desc: "Cores marcantes e blocos. Combina com lojas, sorveterias e açaí." },
];

type KindPreset = {
  design: DesignId;
  color: string;
  cta: string;
  wa: string;
  itemsTitle: string;
  itemsLabel: string;
};

export const PRESETS: Record<Kind, KindPreset> = {
  burger: { design: "urbano", color: "#e0452c", cta: "Pedir pelo WhatsApp", wa: "Olá! Vi o site e quero fazer um pedido.", itemsTitle: "Cardápio", itemsLabel: "O que sai da chapa" },
  restaurante: { design: "editorial", color: "#a4491f", cta: "Reservar ou pedir", wa: "Olá! Vi o site e gostaria de reservar uma mesa.", itemsTitle: "Cardápio", itemsLabel: "À mesa" },
  cafe: { design: "editorial", color: "#8a5a3c", cta: "Encomendar", wa: "Olá! Vi o site e gostaria de fazer uma encomenda.", itemsTitle: "Cardápio", itemsLabel: "Da vitrine" },
  barbearia: { design: "urbano", color: "#c19a4a", cta: "Agendar horário", wa: "Olá! Vi o site e quero agendar um horário.", itemsTitle: "Serviços", itemsLabel: "Na cadeira" },
  salao: { design: "editorial", color: "#b8457a", cta: "Agendar horário", wa: "Olá! Vi o site e gostaria de agendar um horário.", itemsTitle: "Serviços", itemsLabel: "O que fazemos" },
  clinica: { design: "limpo", color: "#0f7fb3", cta: "Agendar consulta", wa: "Olá! Vi o site e gostaria de agendar uma consulta.", itemsTitle: "Atendimentos", itemsLabel: "Atendimentos" },
  oficina: { design: "urbano", color: "#f07a1b", cta: "Pedir orçamento", wa: "Olá! Vi o site e gostaria de um orçamento.", itemsTitle: "Serviços", itemsLabel: "O que fazemos" },
  fitness: { design: "urbano", color: "#b7e22e", cta: "Aula experimental", wa: "Olá! Vi o site e quero agendar uma aula experimental.", itemsTitle: "Modalidades", itemsLabel: "Modalidades" },
  loja: { design: "vitrine", color: "#5b3df0", cta: "Chamar no WhatsApp", wa: "Olá! Vi o site e gostaria de saber mais sobre os produtos.", itemsTitle: "Produtos", itemsLabel: "Na vitrine" },
  servicos: { design: "limpo", color: "#1d4ed8", cta: "Pedir orçamento", wa: "Olá! Vi o site e gostaria de um orçamento.", itemsTitle: "Serviços", itemsLabel: "O que fazemos" },
  generico: { design: "limpo", color: "#1d6fe0", cta: "Falar no WhatsApp", wa: "Olá! Vi o site e gostaria de mais informações.", itemsTitle: "Serviços", itemsLabel: "O que oferecemos" },
};

/* ---------------- Utilidades ---------------- */

export function esc(value: string) {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

export function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site"
  );
}

function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function readable(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? "#141414" : "#ffffff";
}

function safeUrl(value: string) {
  return /^https:\/\/[^\s"'<>]+$/i.test(value) ? value : "";
}

function safeImage(value: string) {
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : "";
}

/** Garante que os dados são seguros e dentro dos limites antes de publicar. */
export function sanitizeSite(raw: Partial<SiteData>): SiteData {
  const text = (value: unknown, max: number) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
  const list = (value: unknown, max: number, size: number) =>
    (Array.isArray(value) ? value : []).map((item) => text(item, size)).filter(Boolean).slice(0, max);
  const kinds = Object.keys(KIND_LABELS) as Kind[];
  const kind = kinds.includes(raw.kind as Kind) ? (raw.kind as Kind) : "generico";
  const design = DESIGNS.some((d) => d.id === raw.design) ? (raw.design as DesignId) : PRESETS[kind].design;
  const color = /^#[0-9a-fA-F]{6}$/.test(String(raw.color || "")) ? String(raw.color) : PRESETS[kind].color;
  return {
    name: text(raw.name, 90),
    tagline: text(raw.tagline, 120),
    phone: text(raw.phone, 30),
    address: text(raw.address, 200),
    city: text(raw.city, 80),
    category: text(raw.category, 80),
    rating: Math.max(0, Math.min(5, Number(raw.rating) || 0)),
    reviews: Math.max(0, Math.min(1_000_000, Math.round(Number(raw.reviews) || 0))),
    showRating: raw.showRating !== false,
    mapsUrl: safeUrl(text(raw.mapsUrl, 500)),
    instagram: safeUrl(text(raw.instagram, 300)),
    hours: list(raw.hours, 7, 80),
    about: text(raw.about, 1200),
    highlights: list(raw.highlights, 6, 120),
    items: (Array.isArray(raw.items) ? raw.items : [])
      .map((item) => ({
        name: text((item as SiteItem)?.name, 80),
        desc: text((item as SiteItem)?.desc, 200),
        price: text((item as SiteItem)?.price, 24),
      }))
      .filter((item) => item.name)
      .slice(0, 40),
    photos: (Array.isArray(raw.photos) ? raw.photos : []).map((p) => safeImage(String(p))).filter(Boolean).slice(0, 10),
    logo: safeImage(String(raw.logo || "")),
    kind,
    design,
    color,
  };
}

/* ---------------- Gerador ---------------- */

const FONTS: Record<DesignId, { url: string; head: string; body: string }> = {
  editorial: {
    url: "family=Fraunces:opsz,wght@9..144,500;9..144,600&family=DM+Sans:wght@400;500;600",
    head: "'Fraunces', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
  },
  urbano: {
    url: "family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600",
    head: "'Barlow Condensed', 'Arial Narrow', sans-serif",
    body: "'Barlow', system-ui, sans-serif",
  },
  limpo: {
    url: "family=Plus+Jakarta+Sans:wght@400;500;600;700;800",
    head: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  vitrine: {
    url: "family=Outfit:wght@400;500;600;700;800",
    head: "'Outfit', system-ui, sans-serif",
    body: "'Outfit', system-ui, sans-serif",
  },
};

const THEME: Record<DesignId, { bg: string; fg: string; muted: string; line: string; card: string; dark: boolean }> = {
  editorial: { bg: "#faf7f1", fg: "#231f1a", muted: "#6f665a", line: "#e3dccf", card: "#ffffff", dark: false },
  urbano: { bg: "#0f0f11", fg: "#f3efe6", muted: "#a39e92", line: "#2a2a2e", card: "#18181b", dark: true },
  limpo: { bg: "#ffffff", fg: "#0f172a", muted: "#5b6577", line: "#e5e9f0", card: "#f6f8fb", dark: false },
  vitrine: { bg: "#fffdf8", fg: "#1c1b22", muted: "#66636f", line: "#ece6d8", card: "#ffffff", dark: false },
};

const ICON = {
  wa: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.2-.31a8.1 8.1 0 1 1 6.92 3.84Zm4.45-6.06c-.24-.12-1.45-.72-1.67-.8-.23-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.52.06a6.6 6.6 0 0 1-1.95-1.2 7.3 7.3 0 0 1-1.35-1.68c-.14-.24 0-.37.1-.5.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.47-.4-.4-.55-.41h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.45-.6 1.65-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.46-.28Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7L12 3Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
};

export function buildSite(input: SiteData): string {
  const d = sanitizeSite(input);
  const preset = PRESETS[d.kind];
  const theme = THEME[d.design];
  const font = FONTS[d.design];
  const accent = d.color;
  const accentFg = readable(accent);
  const rawName = d.name || "Nome da empresa";
  const name = esc(rawName);
  const cityShort = d.city.split(",")[0].trim();
  const category = d.category || KIND_LABELS[d.kind].split(" / ")[0];
  const digits = waNumber(d.phone);
  const wa = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(preset.wa)}` : "";
  const ctaHref = wa || "#contato";
  const hasPhotos = d.photos.length > 0;
  const rating = d.rating > 0 && d.showRating;
  const ratingText = d.rating.toFixed(1).replace(".", ",");
  const hours = d.hours;
  const title = `${rawName}${cityShort ? ` · ${category} em ${cityShort}` : ` · ${category}`}`;
  const description = `${rawName}${cityShort ? `, ${category.toLowerCase()} em ${cityShort}` : ""}.${d.address ? ` ${d.address}.` : ""}`;
  const mapQuery = encodeURIComponent(`${rawName} ${d.address}`.trim());
  const sections: [string, string][] = [["sobre", "Sobre"]];
  if (d.items.length) sections.push(["itens", preset.itemsTitle]);
  if (hasPhotos && d.photos.length > 1) sections.push(["galeria", "Fotos"]);
  sections.push(["contato", "Contato"]);

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: rawName,
    ...(digits ? { telephone: `+${digits}` } : {}),
    ...(d.address ? { address: { "@type": "PostalAddress", streetAddress: d.address } } : {}),
    ...(d.mapsUrl ? { hasMap: d.mapsUrl } : {}),
  };

  const logo = d.logo ? `<img class="logo" src="${d.logo}" alt="${name}">` : `<span class="brand">${name}</span>`;
  const nav = sections.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("");

  const heroMeta = [
    `<span>${esc(category)}${cityShort ? ` · ${esc(cityShort)}` : ""}</span>`,
    rating ? `<span class="chip">${ICON.star} ${ratingText} no Google${d.reviews ? ` · ${d.reviews} avaliações` : ""}</span>` : "",
    hours.length ? `<span class="chip" id="open" hidden></span>` : "",
  ]
    .filter(Boolean)
    .join("");

  const heroActions = `<div class="actions">${
    wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">${ICON.wa}<span>${esc(preset.cta)}</span></a>` : ""
  }${d.items.length ? `<a class="btn ghost" href="#itens">${esc(preset.itemsTitle)}${ICON.arrow}</a>` : `<a class="btn ghost" href="#contato">Como chegar${ICON.arrow}</a>`}</div>`;

  const facts = `<aside class="facts">
${d.address ? `<p>${ICON.pin}<span>${esc(d.address)}</span></p>` : ""}
${d.phone ? `<p>${ICON.phone}<a href="tel:+${digits}">${esc(formatPhone(d.phone))}</a></p>` : ""}
${hours.length ? `<p>${ICON.clock}<span data-today>${esc(hours[0] ?? "")}</span></p>` : ""}
</aside>`;

  const hero = hasPhotos
    ? `<header class="hero photo"><img class="hero-img" src="${d.photos[0]}" alt="${name}" fetchpriority="high"><div class="shade"></div><div class="wrap hero-in"><div class="hero-copy"><p class="meta">${heroMeta}</p><h1>${name}</h1>${d.tagline ? `<p class="lead">${esc(d.tagline)}</p>` : ""}${heroActions}</div></div></header>`
    : `<header class="hero type"><div class="wrap hero-in"><div class="hero-copy"><p class="meta">${heroMeta}</p><h1>${name}</h1>${d.tagline ? `<p class="lead">${esc(d.tagline)}</p>` : ""}${heroActions}</div>${facts}</div></header>`;

  const autoAbout = [
    `${rawName} é ${/^[aeiou]/i.test(category) ? "um" : "um(a)"} ${category.toLowerCase()}${cityShort ? ` em ${cityShort}` : ""}.`,
    d.address ? `Fica em ${d.address}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const aboutText = d.about || autoAbout;
  const about = `<section class="sec" id="sobre"><div class="wrap two"><div><p class="eyebrow">Sobre</p><h2>Quem somos</h2></div><div class="prose">${aboutText
    .split(/\n+/)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("")}${
    d.highlights.length
      ? `<ol class="hl">${d.highlights.map((h, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span>${esc(h)}</li>`).join("")}</ol>`
      : ""
  }</div></div></section>`;

  const items = d.items.length
    ? `<section class="sec alt" id="itens"><div class="wrap"><p class="eyebrow">${esc(preset.itemsLabel)}</p><h2>${esc(preset.itemsTitle)}</h2><ul class="items">${d.items
        .map(
          (item) =>
            `<li><div class="it-top"><h3>${esc(item.name)}</h3><span class="dots"></span>${item.price ? `<strong>${esc(item.price)}</strong>` : ""}</div>${item.desc ? `<p>${esc(item.desc)}</p>` : ""}</li>`,
        )
        .join("")}</ul>${wa ? `<p class="after"><a class="btn" href="${wa}" target="_blank" rel="noopener">${ICON.wa}<span>${esc(preset.cta)}</span></a></p>` : ""}</div></section>`
    : "";

  const gallery =
    d.photos.length > 1
      ? `<section class="sec" id="galeria"><div class="wrap"><p class="eyebrow">Fotos</p><div class="gal">${d.photos
          .slice(1)
          .map((p, i) => `<img src="${p}" alt="${name} — foto ${i + 2}" loading="lazy">`)
          .join("")}</div></div></section>`
      : "";

  const contact = `<section class="sec ${d.items.length ? "" : "alt"}" id="contato"><div class="wrap two"><div><p class="eyebrow">Contato</p><h2>${esc(cityShort ? `Venha até ${cityShort}` : "Fale com a gente")}</h2><div class="info">
${d.address ? `<p>${ICON.pin}<span>${esc(d.address)}</span></p>` : ""}
${d.phone ? `<p>${ICON.phone}<a href="tel:+${digits}">${esc(formatPhone(d.phone))}</a></p>` : ""}
</div>
${hours.length ? `<ul class="hours">${hours.map((line, i) => `<li data-day="${i}">${esc(line)}</li>`).join("")}</ul>` : ""}
<p class="links">${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">${ICON.wa}<span>${esc(preset.cta)}</span></a>` : ""}${d.mapsUrl ? `<a class="btn ghost" href="${d.mapsUrl}" target="_blank" rel="noopener">Abrir no Google Maps</a>` : ""}${d.instagram ? `<a class="btn ghost" href="${d.instagram}" target="_blank" rel="noopener">Instagram</a>` : ""}</p></div>
<div class="map"><iframe loading="lazy" title="Mapa" src="https://www.google.com/maps?q=${mapQuery}&output=embed"></iframe></div></div></section>`;

  const footer = `<footer><div class="wrap"><span>${name}</span><span>${d.address ? esc(d.address) : ""}</span></div></footer>`;

  const css = `:root{--bg:${theme.bg};--fg:${theme.fg};--muted:${theme.muted};--line:${theme.line};--card:${theme.card};--accent:${accent};--accent-fg:${accentFg};--head:${font.head};--body:${font.body}}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--fg);font-family:var(--body);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}a{color:inherit}.wrap{width:min(1120px,100% - 40px);margin-inline:auto}
h1,h2,h3{font-family:var(--head);font-weight:${d.design === "urbano" ? 700 : d.design === "editorial" ? 600 : 800};line-height:1.04;letter-spacing:${d.design === "urbano" ? ".01em" : "-.02em"};${d.design === "urbano" ? "text-transform:uppercase;" : ""}}
.top{position:sticky;top:0;z-index:30;background:${theme.dark ? "rgba(15,15,17,.86)" : "rgba(255,255,255,.88)"};backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;height:66px}
.brand{font-family:var(--head);font-weight:700;font-size:21px;${d.design === "urbano" ? "text-transform:uppercase;letter-spacing:.03em;" : ""}}.logo{height:38px;width:auto}
.top nav{display:flex;gap:26px;font-size:15px;color:var(--muted)}.top nav a{text-decoration:none}.top nav a:hover{color:var(--fg)}
.btn{display:inline-flex;align-items:center;gap:10px;background:var(--accent);color:var(--accent-fg);padding:14px 24px;border-radius:${d.design === "urbano" ? "3px" : d.design === "editorial" ? "999px" : "12px"};font-weight:600;font-size:16px;text-decoration:none;border:1.5px solid var(--accent);transition:transform .18s,box-shadow .18s}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px -12px var(--accent)}.btn.ghost{background:transparent;color:var(--fg);border-color:var(--line)}.btn.ghost:hover{border-color:var(--fg);box-shadow:none}
.top .btn{padding:10px 18px;font-size:15px;white-space:nowrap}.brand{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.hero{position:relative;color:var(--fg)}.hero h1{font-size:clamp(46px,9vw,112px);margin:14px 0 18px;overflow-wrap:anywhere}
.meta{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;font-size:15px;color:var(--muted)}.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:5px 12px;color:var(--fg);font-size:14px}.chip svg{color:var(--accent)}.chip[hidden]{display:none}
.lead{font-size:clamp(18px,2.4vw,24px);max-width:560px;color:var(--muted)}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.hero.type{padding:clamp(48px,8vw,104px) 0 clamp(40px,6vw,80px);border-bottom:1px solid var(--line)}
.hero.type .hero-in{display:grid;grid-template-columns:1.5fr .9fr;gap:48px;align-items:end}
.facts{border-left:2px solid var(--accent);padding-left:22px;display:grid;gap:14px;font-size:16px}.facts p,.info p{display:flex;gap:12px;align-items:flex-start}.facts svg,.info svg{flex:none;margin-top:4px;color:var(--accent)}
.hero.photo{min-height:min(86vh,760px);display:flex;align-items:flex-end;color:#fff}.hero.photo .hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero.photo .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,.18) 35%,rgba(0,0,0,.72) 100%)}
.hero.photo .hero-in{position:relative;padding:120px 0 clamp(36px,6vw,72px);width:min(1120px,100% - 40px);margin-inline:auto}.hero.photo .meta,.hero.photo .lead{color:rgba(255,255,255,.86)}.hero.photo .chip{color:#fff;border-color:rgba(255,255,255,.4)}.hero.photo .btn.ghost{color:#fff;border-color:rgba(255,255,255,.55)}
.sec{padding:clamp(60px,9vw,120px) 0}.sec.alt{background:var(--card);border-block:1px solid var(--line)}
.eyebrow{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:14px}
.sec h2{font-size:clamp(32px,5vw,56px);margin-bottom:20px}.two{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(28px,6vw,80px);align-items:start}
.prose p{margin-bottom:16px;max-width:60ch;color:${theme.dark ? "#d9d4c8" : "var(--fg)"}}.hl{list-style:none;margin-top:26px;border-top:1px solid var(--line)}.hl li{display:flex;gap:18px;padding:14px 0;border-bottom:1px solid var(--line);font-weight:500}.hl span{color:var(--accent);font-family:var(--head);font-weight:700}
.items{list-style:none;margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:6px 56px}.items li{padding:16px 0;border-bottom:1px solid var(--line)}
.it-top{display:flex;align-items:baseline;gap:10px}.it-top h3{font-size:22px;font-family:var(--head)}.dots{flex:1;border-bottom:1.5px dotted var(--line);transform:translateY(-4px)}.it-top strong{font-family:var(--head);font-size:20px;color:var(--accent)}.items p{color:var(--muted);font-size:15px;margin-top:4px;max-width:46ch}.after{margin-top:34px}
.gal{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:8px}.gal img{width:100%;height:100%;object-fit:cover;border-radius:${d.design === "urbano" ? "2px" : "10px"};aspect-ratio:4/3;grid-column:span 2}.gal img:nth-child(1){grid-column:span 4;grid-row:span 2;aspect-ratio:auto;min-height:320px}
.info{display:grid;gap:12px;margin-bottom:22px}.hours{list-style:none;margin:6px 0 26px;max-width:380px;border-top:1px solid var(--line)}.hours li{padding:9px 0;border-bottom:1px solid var(--line);color:var(--muted);font-size:15px}.hours li.today{color:var(--fg);font-weight:600}.hours li.today::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:10px;vertical-align:middle}
.links{display:flex;flex-wrap:wrap;gap:12px}.map iframe{width:100%;height:100%;min-height:380px;border:1px solid var(--line);border-radius:${d.design === "urbano" ? "2px" : "14px"};filter:${theme.dark ? "invert(.9) hue-rotate(180deg) saturate(.7)" : "saturate(.85)"}}
footer{border-top:1px solid var(--line);padding:26px 0;font-size:14px;color:var(--muted)}footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}
.wa{position:fixed;right:18px;bottom:18px;z-index:40;width:56px;height:56px;border-radius:50%;background:#1fb85a;color:#fff;display:grid;place-items:center;box-shadow:0 10px 26px -8px rgba(0,0,0,.45);transition:transform .18s}.wa:hover{transform:scale(1.07)}.wa svg{width:28px;height:28px}
${d.design === "vitrine" ? `.hero.type{background:color-mix(in srgb,var(--accent) 12%,var(--bg))}.sec.alt{background:color-mix(in srgb,var(--accent) 7%,var(--bg))}.hero.type .chip{background:var(--card)}.hero.type h1{color:color-mix(in srgb,var(--accent) 80%,#000)}` : ""}
${d.design === "editorial" ? `.hero h1{font-weight:500;letter-spacing:-.035em}.hero.photo h1{font-weight:500}` : ""}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.hero-copy>*{animation:rise .7s both}.hero-copy>*:nth-child(2){animation-delay:.08s}.hero-copy>*:nth-child(3){animation-delay:.16s}.hero-copy>*:nth-child(4){animation-delay:.24s}
@media(prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important}}
@media(max-width:560px){.top .btn{display:none}.hero.photo{min-height:78vh}}
@media(max-width:820px){.top nav{display:none}.hero.type .hero-in,.two{grid-template-columns:1fr}.items{grid-template-columns:1fr}.gal{grid-template-columns:repeat(2,1fr)}.gal img,.gal img:nth-child(1){grid-column:span 1;grid-row:auto;aspect-ratio:4/3;min-height:0}.gal img:nth-child(1){grid-column:span 2}.map iframe{min-height:300px}body{font-size:16px}}
.lhbar{position:fixed;left:14px;bottom:18px;z-index:40;max-width:calc(100% - 100px);background:rgba(20,20,20,.9);color:#fff;font:500 12px/1.35 system-ui,sans-serif;padding:9px 13px;border-radius:999px}`;

  const script = `document.querySelectorAll('[data-today]');
(function(){var day=(new Date().getDay()+6)%7;var li=document.querySelectorAll('ul.hours li');var o=document.getElementById('open');var t=document.querySelector('[data-today]');
if(li.length===7){li[day].className='today';if(t)t.textContent='Hoje: '+li[day].textContent.replace(/^[^:]+:\\s*/,'');
var m=li[day].textContent.match(/(\\d{1,2}):(\\d{2})\\s*[–-]\\s*(\\d{1,2}):(\\d{2})/);
if(m&&o){var n=new Date(),a=+m[1]*60+ +m[2],b=+m[3]*60+ +m[4],c=n.getHours()*60+n.getMinutes();var open=b>a?(c>=a&&c<b):(c>=a||c<b);o.textContent=open?'Aberto agora':'Fechado agora';o.hidden=false}}})();`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<!--LH_ROBOTS-->
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="${theme.bg}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${font.url}&display=swap">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>${css}</style>
</head>
<body>
<div class="top"><div class="wrap">${logo}<nav>${nav}</nav>${wa ? `<a class="btn" href="${wa}" target="_blank" rel="noopener">${esc(preset.cta)}</a>` : ""}</div></div>
${hero}
${about}
${items}
${gallery}
${contact}
${footer}
${wa ? `<a class="wa" href="${wa}" target="_blank" rel="noopener" aria-label="${esc(preset.cta)}">${ICON.wa}</a>` : ""}
<!--LH_BAR-->
<script>${script}</script>
</body>
</html>`;
}

/** Aplica os avisos de prévia e o bloqueio do Google no HTML pronto (usado só na hospedagem). */
export function finalizeHosted(html: string, mode: "previa" | "final", indexable: boolean) {
  const robots = indexable && mode === "final" ? "" : '<meta name="robots" content="noindex,nofollow">';
  const bar =
    mode === "previa"
      ? '<div class="lhbar">Prévia de demonstração. Este não é o site oficial da empresa.</div>'
      : "";
  return html.replace("<!--LH_ROBOTS-->", robots).replace("<!--LH_BAR-->", bar);
}
