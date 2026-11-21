import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  Clock,
  Cloud,
  CloudOff,
  Columns3,
  Copy,
  Download,
  BookOpen,
  CheckCircle2,
  Flame,
  Globe,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  List,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Megaphone,
  MessageCircle,
  Moon,
  Phone,
  PhoneCall,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  SkipForward,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { checkAccessKey, searchPlaces, type KeyCheck, type Lead } from "@/lib/leads.functions";
import { aiLeadMessage } from "@/lib/ai.functions";
import { loadCloud, saveCloud, type CloudData } from "@/lib/cloud.functions";
import { getIntegrationStatus, type IntegrationStatus } from "@/lib/integrations.functions";
import { getAnnouncement, requestTrial } from "@/lib/extras.functions";
import { SUPPORT_WHATSAPP } from "@/lib/plans";
import { ALL_NICHES, NICHE_GROUPS } from "@/lib/niches";
import { OBJECOES } from "@/lib/objecoes";
import { MySitesModal, SiteStudio } from "@/components/site-studio";
import { SiteAuditModal } from "@/components/site-audit";
import { linkGoogle } from "@/lib/google.functions";
import {
  FIRST_TEMPLATES,
  FOLLOW_TEMPLATES,
  INTERNATIONAL_TEMPLATES,
  bestContactTime,
  suggestTemplate,
} from "@/lib/templates";
import {
  DEFAULT_FOLLOW_MSG,
  DEFAULT_MSG,
  clearAccessKey,
  clearLocalData,
  getDeviceId,
  loadAccessKey,
  loadAnnDismissed,
  loadDailyGoal,
  loadFollowMsg,
  loadGoal,
  loadTourDone,
  loadMsg,
  loadPrefs,
  loadPipeline,
  loadRecent,
  loadTheme,
  loadCustomMessages,
  loadSearchActivity,
  loadProfilePhoto,
  loadNotificationsEnabled,
  loadTicket,
  loadUserName,
  saveAccessKey,
  saveAnnDismissed,
  saveDailyGoal,
  saveFollowMsg,
  saveGoal,
  saveTourDone,
  saveMsg,
  saveRecent,
  savePrefs,
  saveCustomMessages,
  saveSearchActivity,
  saveProfilePhoto,
  saveNotificationsEnabled,
  savePipeline,
  saveTheme,
  saveTicket,
  saveUserName,
  type RecentSearch,
  type SearchActivity,
  type CustomMessage,
  type SavedLead,
  type Theme,
  type Status,
} from "@/lib/storage";

const CITIES = Array.from(new Set([
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Brasília, DF",
  "Curitiba, PR",
  "Porto Alegre, RS",
  "Salvador, BA",
  "Fortaleza, CE",
  "Recife, PE",
  "Manaus, AM",
  "Belém, PA",
  "Goiânia, GO",
  "Campinas, SP",
  "São Luís, MA",
  "Maceió, AL",
  "Natal, RN",
  "João Pessoa, PB",
  "Teresina, PI",
  "Florianópolis, SC",
  "Vitória, ES",
  "Cuiabá, MT",
  "Campo Grande, MS",
  "Aracaju, SE",
  "Ribeirão Preto, SP",
  "Sorocaba, SP",
  "Santos, SP",
  "São José dos Campos, SP",
  "Joinville, SC",
  "Londrina, PR",
  "Uberlândia, MG",
  "Niterói, RJ",
  "Contagem, MG",
  "Betim, MG",
  "Ribeirão das Neves, MG",
  "Santa Luzia, MG",
  "Sete Lagoas, MG",
  "Divinópolis, MG",
  "Juiz de Fora, MG",
  "Montes Claros, MG",
  "Ipatinga, MG",
  "Governador Valadares, MG",
  "Uberaba, MG",
  "Poços de Caldas, MG",
  "Pouso Alegre, MG",
  "Varginha, MG",
  "Guarulhos, SP",
  "Osasco, SP",
  "Santo André, SP",
  "São Bernardo do Campo, SP",
  "São José do Rio Preto, SP",
  "Bauru, SP",
  "Jundiaí, SP",
  "Piracicaba, SP",
  "Duque de Caxias, RJ",
  "Nova Iguaçu, RJ",
  "São Gonçalo, RJ",
  "Campos dos Goytacazes, RJ",
  "Petrópolis, RJ",
  "Caxias do Sul, RS",
  "Pelotas, RS",
  "Canoas, RS",
  "Blumenau, SC",
  "Maringá, PR",
  "Ponta Grossa, PR",
  "Cascavel, PR",
  "Feira de Santana, BA",
  "Vitória da Conquista, BA",
  "Caruaru, PE",
  "Olinda, PE",
  "Juazeiro do Norte, CE",
  "Anápolis, GO",
  "Aparecida de Goiânia, GO",
  "Palmas, TO",
  "Porto Velho, RO",
  "Rio Branco, AC",
  "Macapá, AP",
  "Boa Vista, RR",
  "Imperatriz, MA",
  "Mossoró, RN",
  "Campina Grande, PB",
  "Vila Velha, ES",
  "Serra, ES",
  // Mais cidades para ampliar a prospecção regional e nacional.
  "Alfenas, MG",
  "Barbacena, MG",
  "Conselheiro Lafaiete, MG",
  "Coronel Fabriciano, MG",
  "Itabira, MG",
  "Itajubá, MG",
  "Lavras, MG",
  "Manhuaçu, MG",
  "Muriae, MG",
  "Nova Lima, MG",
  "Ouro Preto, MG",
  "Patos de Minas, MG",
  "Passos, MG",
  "Patrocínio, MG",
  "São João del-Rei, MG",
  "Timóteo, MG",
  "Três Corações, MG",
  "Araguari, MG",
  "Araçatuba, SP",
  "Atibaia, SP",
  "Barretos, SP",
  "Bragança Paulista, SP",
  "Franca, SP",
  "Indaiatuba, SP",
  "Itapetininga, SP",
  "Limeira, SP",
  "Marília, SP",
  "Presidente Prudente, SP",
  "Rio Claro, SP",
  "Taubaté, SP",
  "Americana, SP",
  "Cabo Frio, RJ",
  "Macaé, RJ",
  "Volta Redonda, RJ",
  "Angra dos Reis, RJ",
  "Alagoinhas, BA",
  "Ilhéus, BA",
  "Itabuna, BA",
  "Juazeiro, BA",
  "Barreiras, BA",
  "Camaçari, BA",
  "Arcoverde, PE",
  "Garanhuns, PE",
  "Petrolina, PE",
  "Sobral, CE",
  "Crato, CE",
  "Parnaíba, PI",
  "Arapiraca, AL",
  "Carpina, PE",
  "Dourados, MS",
  "Três Lagoas, MS",
  "Rondonópolis, MT",
  "Sinop, MT",
  "Ji-Paraná, RO",
  "Criciúma, SC",
  "Chapecó, SC",
  "Itajaí, SC",
  "Jaraguá do Sul, SC",
  "Lages, SC",
  "Passo Fundo, RS",
  "Santa Maria, RS",
  "Novo Hamburgo, RS",
  "Gravataí, RS",
  "Pato Branco, PR",
  "Foz do Iguaçu, PR",
  "Guarapuava, PR",
  "Paranaguá, PR",
  "Toledo, PR",
  "Rio Verde, GO",
  "Catalão, GO",
  "Luziânia, GO",
  "Dourados, MS",
  "Imperatriz, MA",
  "Bacabal, MA",
  "Açailândia, MA",
  "Gurupi, TO",
  "Araguaína, TO",
  "Santana, AP",
  "Parintins, AM",
  "Santarém, PA",
  "Marabá, PA",
  "Castanhal, PA",
]));

const QUANTITIES = [5, 10, 15, 20, 30, 40, 50, 60];

type Tab = "inicio" | "buscar" | "hoje" | "pipeline" | "vendas" | "mensagens" | "atividades" | "relatorios" | "oportunidades" | "integracoes" | "configuracoes";

const TAB_LABELS: Record<Tab, string> = {
  inicio: "Dashboard",
  buscar: "Buscar leads",
  hoje: "Tarefas de hoje",
  pipeline: "CRM / Pipeline",
  vendas: "Vendas",
  mensagens: "Central de mensagens",
  atividades: "Histórico de atividades",
  relatorios: "Relatórios",
  oportunidades: "Inteligência de leads",
  integracoes: "Integrações",
  configuracoes: "Configurações",
};

const STATUSES: { id: Status; label: string }[] = [
  { id: "novo", label: "Novos leads" },
  { id: "contatado", label: "Primeiro contato" },
  { id: "aguardando", label: "Aguardando resposta" },
  { id: "interessado", label: "Interessados" },
  { id: "proposta", label: "Em negociação" },
  { id: "fechado", label: "Clientes fechados" },
  { id: "perdido", label: "Perdidos" },
];

function formatPhone(phone: string) {
  if (phone.length === 11) return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  if (phone.length === 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return phone;
}

function fillTemplate(template: string, name: string, city = "", category = "") {
  return template
    .replaceAll("{nome}", name)
    .replaceAll("{cidade}", city.split(",")[0])
    .replaceAll("{segmento}", category || "seu segmento");
}

function waLink(phone: string, name: string, template: string, city = "", category = "") {
  return `https://wa.me/55${phone}?text=${encodeURIComponent(fillTemplate(template, name, city, category))}`;
}

function escapeHtml(value: string) {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

function addHistory(row: SavedLead, text: string, stamp = new Date().toISOString()): SavedLead {
  const list = row.history ?? [];
  const last = list[list.length - 1];
  if (last && last.text === text && new Date(stamp).getTime() - new Date(last.at).getTime() < 60000) return row;
  return { ...row, history: [...list, { at: stamp, text }].slice(-50) };
}

/** Abre uma proposta editável em outra aba, pronta para imprimir ou salvar em PDF. */
function openProposal(lead: SavedLead, author: string) {
  const win = window.open("", "_blank");
  if (!win) return false;
  const price = lead.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const today = new Date().toLocaleDateString("pt-BR");
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta - ${escapeHtml(lead.name)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#0e2a4a;max-width:760px;margin:0 auto;padding:32px 24px;line-height:1.55}
h1{font-size:26px;margin:0 0 4px}.muted{color:#5a7391;font-size:14px}.box{border:1px solid #d2e3f7;border-radius:12px;padding:16px 20px;margin:18px 0}
.price{font-size:30px;font-weight:700;color:#1d6fe0}li{margin:6px 0}.bar{position:sticky;top:0;background:#eaf4ff;padding:10px 16px;margin:-32px -24px 24px;display:flex;gap:12px;align-items:center;font-size:14px}
button{background:#2b86f5;color:#fff;border:0;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer}
@media print{.bar{display:none}body{padding:0}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Imprimir / salvar PDF</button><span>Clique no texto para editar antes de imprimir.</span></div>
<div contenteditable="true">
<h1>Proposta de criação de site</h1>
<p class="muted">Preparada em ${today} para <strong>${escapeHtml(lead.name)}</strong>${lead.city ? ` · ${escapeHtml(lead.city.split(",")[0])}` : ""}</p>
<div class="box"><p><strong>O que você recebe</strong></p><ul>
<li>Site profissional que funciona bem no celular e no computador</li>
<li>Botão de WhatsApp para o cliente chamar direto</li>
<li>Localização no mapa, horários e fotos do seu negócio</li>
<li>Textos escritos para vender os seus serviços</li>
<li>Publicação no ar e ajuda para aparecer no Google</li></ul></div>
<div class="box"><p><strong>Investimento</strong></p><p class="price">${price}</p><p class="muted">Forma de pagamento e prazo de entrega: a combinar.</p></div>
<p class="muted">Proposta válida por 7 dias. Para aprovar, é só responder esta mensagem.</p>
<p><strong>${escapeHtml(author || "Seu nome")}</strong></p>
</div></body></html>`);
  win.document.close();
  win.focus();
  return true;
}

function applyStatus(row: SavedLead, status: Status): SavedLead {
  if (row.status === status) return row;
  const stamp = new Date().toISOString();
  const label = (id: Status) => STATUSES.find((item) => item.id === id)?.label ?? id;
  return addHistory(
    {
      ...row,
      status,
      lastContact: status === "contatado" || status === "proposta" ? stamp : row.lastContact,
      closedAt: status === "fechado" ? stamp : undefined,
    },
    `Status: ${label(row.status)} → ${label(status)}`,
    stamp,
  );
}

/** Cadência: dias até o próximo retorno depois das mensagens 1, 2 e 3. */
const GAPS = [2, 3, 5];

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

function stepOf(row: SavedLead) {
  return row.step ?? (row.status === "novo" ? 0 : 1);
}

function messageForStep(step: number, first: string, follow: string) {
  if (step <= 0) return first;
  if (step === 1) return follow;
  if (step === 2) return FOLLOW_TEMPLATES[1].text;
  return FOLLOW_TEMPLATES[2].text;
}

/** Registra que a mensagem da vez foi enviada e já marca o próximo retorno. */
function sendRow(row: SavedLead): SavedLead {
  const step = stepOf(row) + 1;
  const stamp = new Date().toISOString();
  const moved = applyStatus(row, row.status === "novo" ? "contatado" : row.status);
  const followUp = step <= GAPS.length ? addDaysIso(GAPS[step - 1]) : undefined;
  return addHistory({ ...moved, step, lastContact: stamp, followUp }, `Mensagem ${step} enviada`, stamp);
}

const TEMPS = [
  ["quente", "🔥 Quente"],
  ["morno", "🌤 Morno"],
  ["frio", "❄️ Frio"],
] as const;

function readTicket(ticket: string): { email: string; name: string } {
  try {
    const body = ticket.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(body + "=".repeat((4 - (body.length % 4)) % 4)), (ch) => ch.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { email?: string; name?: string };
    return { email: data.email ?? "", name: data.name ?? "" };
  } catch {
    return { email: "", name: "" };
  }
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  return digits.length === 10 || digits.length === 11 ? digits : "";
}

function parseCsv(text: string) {
  const clean = text.replace(/^\ufeff/, "");
  const first = clean.split("\n")[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((value) => value.trim())) rows.push(row);
    row = [];
  };
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i += 1;
      endRow();
    } else cell += ch;
  }
  endRow();
  return rows;
}

/** Transforma uma planilha (nome, telefone, cidade, notas) em leads do pipeline. */
function leadsFromCsv(text: string, fallbackCity: string, ticket: number) {
  const rows = parseCsv(text);
  if (!rows.length) return { leads: [] as SavedLead[], skipped: 0 };
  const head = rows[0].map((cell) => cell.trim().toLowerCase());
  const find = (pattern: RegExp) => head.findIndex((cell) => pattern.test(cell));
  let iName = find(/^(nome|name|empresa)/);
  let iPhone = find(/(telefone|phone|celular|whatsapp|fone)/);
  const iCity = find(/cidade|city/);
  const iNotes = find(/nota|obs/);
  const hasHeader = iName >= 0 || iPhone >= 0;
  if (iName < 0) iName = 0;
  if (iPhone < 0) iPhone = 1;
  const data = hasHeader ? rows.slice(1) : rows;
  const leads: SavedLead[] = [];
  let skipped = 0;
  const seen = new Set<string>();
  data.forEach((cols, index) => {
    const name = (cols[iName] ?? "").trim();
    const phone = normalizePhone(cols[iPhone] ?? "");
    if (!name || !phone || seen.has(phone)) {
      skipped += 1;
      return;
    }
    seen.add(phone);
    leads.push({
      id: `csv-${Date.now()}-${index}`,
      name,
      category: "Importado",
      phone,
      rating: 0,
      reviews: 0,
      address: "",
      mapsUrl: null,
      city: (iCity >= 0 ? (cols[iCity] ?? "").trim() : "") || fallbackCity,
      status: "novo",
      notes: iNotes >= 0 ? (cols[iNotes] ?? "").trim() : "",
      value: ticket,
      addedAt: new Date().toISOString(),
    });
  });
  return { leads, skipped };
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatKey(raw: string) {
  const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 18);
  return [c.slice(0, 2), c.slice(2, 6), c.slice(6, 10), c.slice(10, 14), c.slice(14, 18)]
    .filter(Boolean)
    .join("-");
}

function BrandMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="leadHunterMark" x1="7" y1="5" x2="41" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B9BFF" />
          <stop offset="1" stopColor="#48C7E8" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="15.5" stroke="url(#leadHunterMark)" strokeWidth="4.2" />
      <circle cx="22" cy="22" r="7.2" stroke="currentColor" strokeOpacity=".92" strokeWidth="3.2" />
      <circle cx="22" cy="22" r="2.4" fill="url(#leadHunterMark)" />
      <path d="M33.5 33.5 42 42" stroke="url(#leadHunterMark)" strokeWidth="5" strokeLinecap="round" />
      <path d="M22 2.8v4.1M2.8 22h4.1" stroke="currentColor" strokeOpacity=".58" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

const card = "app-card rounded-2xl";
const field =
  "w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-indigo-300/20 bg-gradient-to-r from-[#5557e9] to-[#6875f5] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_-12px_rgba(85,87,233,.65)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_26px_-12px_rgba(85,87,233,.75)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55";
const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9deeb] bg-white px-5 py-2.5 text-sm font-semibold text-[#34405a] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#aeb8df] hover:bg-[#f7f8ff] hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-55";

type FollowState = "atrasado" | "hoje" | "futuro" | null;

function todayIso() {
  return new Date().toLocaleDateString("sv-SE");
}

function followState(followUp: string | undefined, today: string): FollowState {
  if (!followUp) return null;
  if (followUp < today) return "atrasado";
  return followUp === today ? "hoje" : "futuro";
}

function brDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}` : iso;
}

function observationAge(observedAt?: string) {
  if (!observedAt) return null;
  const date = new Date(observedAt);
  if (!Number.isFinite(date.getTime())) return null;

  const elapsed = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(elapsed / 86_400_000);
  let age = "agora";
  if (elapsed >= 86_400_000) age = days === 1 ? "há 1 dia" : `há ${days} dias`;
  else if (elapsed >= 3_600_000) {
    const hours = Math.floor(elapsed / 3_600_000);
    age = hours === 1 ? "há 1 hora" : `há ${hours} horas`;
  } else if (elapsed >= 60_000) {
    const minutes = Math.floor(elapsed / 60_000);
    age = minutes === 1 ? "há 1 minuto" : `há ${minutes} minutos`;
  }

  return { age, exact: date.toLocaleString("pt-BR"), stale: days >= 30 };
}

function ObservationBadge({ observedAt, showMissing = false }: { observedAt?: string; showMissing?: boolean }) {
  const observation = observationAge(observedAt);
  if (!observation && !showMissing) return null;
  const stale = !observation || observation.stale;
  return (
    <span
      title={
        observation
          ? `Dados recebidos do Google Places em ${observation.exact}. Isso não confirma se o site continua ativo.`
          : "Este lead não tem uma data registrada de consulta ao Google."
      }
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        stale
          ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
          : "bg-surface-2 text-muted"
      }`}
    >
      <Clock className="size-3.5" />
      {observation
        ? stale
          ? `Dados podem estar antigos · ${observation.age}`
          : `Google consultado ${observation.age}`
        : "Sem data de consulta"}
    </span>
  );
}

type AccessInfo = Extract<KeyCheck, { ok: true }>["info"];

function accessMessage(code: string) {
  switch (code) {
    case "KEY_REVOGADA":
      return "Essa key foi desativada. Fale com o vendedor.";
    case "KEY_EXPIRADA":
      return "Sua key venceu. Renove para continuar usando.";
    case "APARELHOS":
      return "Essa key já está em uso no máximo de aparelhos permitido.";
    case "NAO_VINCULADO":
      return "Entre de novo com a sua key neste aparelho.";
    case "SEM_BANCO":
      return "O servidor ainda não tem banco de dados. O dono precisa conectar o Neon na Vercel (veja /api/saude).";
    case "ERRO_SERVIDOR":
      return "Erro no servidor ao validar a key. O dono pode abrir /api/saude para ver o que falta.";
    default:
      return "Key inválida. Confira e tente de novo.";
  }
}

/** Nota de 0 a 100: empresa bem avaliada, com movimento, aberta agora e com celular tende a responder melhor. */
function leadScore(lead: Lead) {
  // Prioriza o que mais importa para vender criação de sites: ausência de site próprio.
  const websiteOpportunity = lead.siteKind === "none" ? 25 : lead.siteKind === "social" ? 15 : 0;
  const rating = (Math.min(lead.rating, 5) / 5) * 30;
  const reviews = Math.min(Math.log10(lead.reviews + 1) / Math.log10(500), 1) * 20;
  const open = lead.openNow === true ? 15 : lead.openNow === null ? 7 : 0;
  const mobile = lead.phone.length === 11 && lead.phone[2] === "9" ? 10 : 3;
  return Math.min(100, Math.round(websiteOpportunity + rating + reviews + open + mobile));
}

function mergeLeads(local: SavedLead[], cloud: SavedLead[]) {
  const ids = new Set(local.map((row) => row.id));
  const phones = new Set(local.map((row) => row.phone).filter(Boolean));
  const extra = cloud.filter((row) => !ids.has(row.id) && !(row.phone && phones.has(row.phone)));
  return extra.length ? [...local, ...extra] : local;
}

function PriorityBadge({ lead }: { lead: Lead }) {
  const score = leadScore(lead);
  const high = score >= 70;
  const mid = score >= 45;
  return (
    <span
      title={`Potencial comercial ${score}/100: considera ausência de site, avaliações, funcionamento e telefone.`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        high
          ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200"
          : mid
            ? "bg-primary-soft text-primary-deep dark:text-primary"
            : "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
      }`}
    >
      <Flame className="size-3.5" />
      {high ? "Oportunidade alta" : mid ? "Oportunidade média" : "Oportunidade baixa"} · {score}
    </span>
  );
}

function chip(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "border-primary bg-primary text-primary-fg shadow-sm"
      : "glass-control border-border bg-surface text-muted hover:border-primary/50 hover:text-fg"
  }`;
}

function exportCsv(rows: SavedLead[]) {
  const head = ["Nome", "Telefone", "Cidade", "Status", "Valor", "Retorno", "Notas", "Endereço", "Maps", "Consulta Google"];
  // Neutraliza fórmulas para impedir CSV Injection ao abrir no Excel/Sheets.
  const esc = (value: string | number) => {
    let text = String(value ?? "").replace(/[\r\n]+/g, " ");
    if (/^[\s]*[=+@\-]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const lines = rows.map((r) =>
    [
      r.name,
      formatPhone(r.phone),
      r.city,
      r.status,
      r.value,
      r.followUp || "",
      r.notes,
      r.address,
      r.mapsUrl || "",
      r.observedAt ? new Date(r.observedAt).toLocaleString("pt-BR") : "",
    ]
      .map(esc)
      .join(";"),
  );
  const blob = new Blob(["\ufeff" + [head.map(esc).join(";"), ...lines].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leads-${todayIso()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportSearchHistory(rows: SearchActivity[]) {
  const escape = (value: string | number) => {
    let text = String(value ?? "").replace(/[\r\n]+/g, " ");
    if (/^[\s]*[=+@\-]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const lines = [
    ["Data", "Cidade", "Segmento", "Empresas encontradas"].map(escape).join(";"),
    ...rows.map((row) => [new Date(row.at).toLocaleString("pt-BR"), row.city, row.niche, row.count].map(escape).join(";")),
  ];
  const blob = new Blob([String.fromCharCode(0xfeff) + lines.join(String.fromCharCode(13, 10))], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-buscas-" + todayIso() + ".csv";
  link.click();
  URL.revokeObjectURL(url);
}

function OpenBadge({ lead }: { lead: Lead }) {
  if (lead.businessStatus === "CLOSED_TEMPORARILY") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
        Fechada temporariamente
      </span>
    );
  }
  if (lead.openNow === true) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Aberta agora
      </span>
    );
  }
  if (lead.openNow === false) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
        <span className="size-2 rounded-full bg-slate-400" />
        Fechada agora
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-muted">
      Horário não informado
    </span>
  );
}

function SkeletonCards() {
  return (
    <div className="grid gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`space-y-3 p-4 ${card}`}>
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

const LeadCard = memo(function LeadCard({
  lead,
  city,
  message,
  saved,
  onKeep,
  onAudit,
  onPrompt,
}: {
  lead: Lead;
  city: string;
  message: string;
  saved: boolean;
  onKeep: (lead: Lead) => void;
  onAudit?: (lead: Lead) => void;
  onPrompt?: (lead: Lead) => void;
}) {
  return (
    <article className={`lead-card fade-up p-4 ${card}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{lead.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" /> {lead.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-3.5 text-accent" /> {lead.rating || "—"} ({lead.reviews})
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="size-3.5" /> {formatPhone(lead.phone)}
            </span>
          </p>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" /> {lead.address}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OpenBadge lead={lead} />
            <PriorityBadge lead={lead} />
            {lead.siteKind === "site" ? (
              <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                Tem site
              </span>
            ) : lead.siteKind === "social" ? (
              <span
                title={lead.website ?? ""}
                className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
              >
                Só rede social
              </span>
            ) : (
              <span
                title="O Google Places não informa um site oficial; confirme antes de abordar."
                className="inline-block rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-danger"
              >
                Google sem site
              </span>
            )}
            <ObservationBadge observedAt={lead.observedAt} />
            {lead.hoursToday && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Clock className="size-3.5" /> Hoje: {lead.hoursToday}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted" title="Sugestão geral para este tipo de negócio">
              <PhoneCall className="size-3.5" /> Melhor horário: {bestContactTime(lead.category)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={waLink(lead.phone, lead.name, message, city)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-3 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:brightness-105"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <a href={`tel:+55${lead.phone}`} aria-label="Ligar" className={`${btnGhost} px-2.5`}>
            <PhoneCall className="size-4" />
          </a>
          <button
            type="button"
            disabled={saved}
            onClick={() => onKeep(lead)}
            className={`${btnGhost} inline-flex items-center gap-1.5 disabled:opacity-60`}
          >
            {saved ? (
              <>
                <Check className="size-4" /> Guardado
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {onPrompt && (
          <button type="button" onClick={() => onPrompt(lead)} className="font-semibold text-primary hover:underline">
            Criar com IA
          </button>
        )}
        {lead.siteKind === "site" && onAudit && (
          <button type="button" onClick={() => onAudit(lead)} className="font-semibold text-primary hover:underline">
            Analisar o site
          </button>
        )}
        {lead.website && lead.siteKind !== "none" && (
          <a className="font-semibold text-muted" target="_blank" rel="noreferrer" href={lead.website}>
            Abrir {lead.siteKind === "social" ? "o perfil" : "o site"}
          </a>
        )}
        <a
          className="font-semibold text-primary"
          target="_blank"
          rel="noreferrer"
          href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${city} Instagram`)}`}
        >
          Achar Instagram
        </a>
        {lead.mapsUrl && (
          <a className="font-semibold text-muted" target="_blank" rel="noreferrer" href={lead.mapsUrl}>
            Abrir no Maps
          </a>
        )}
      </div>
    </article>
  );
});

const PipelineRow = memo(function PipelineRow({
  lead,
  message,
  followMessage,
  today,
  onStatus,
  onNotes,
  onRemove,
  onCopy,
  onContact,
  selected,
  onSelect,
  onSite,
  onAiMessage,
  aiBusyId,
}: {
  lead: SavedLead;
  message: string;
  followMessage: string;
  today: string;
  onStatus: (id: string, status: Status) => void;
  onNotes: (id: string) => void;
  onRemove: (id: string) => void;
  onCopy: (text: string, label: string) => void;
  onContact: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onSite?: (id: string) => void;
  onAiMessage?: (lead: SavedLead) => void;
  aiBusyId?: string;
}) {
  const follow = followState(lead.followUp, today);
  const active = lead.status !== "fechado" && lead.status !== "perdido";
  const idle = active && lead.status !== "novo" && lead.lastContact ? daysSince(lead.lastContact) : 0;
  const stale = idle >= 3;
  return (
    <article className={`lead-card fade-up p-4 ${card}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold">
            {onSelect && (
              <input
                type="checkbox"
                checked={!!selected}
                onChange={() => onSelect(lead.id)}
                aria-label="Selecionar lead"
                className="size-4 shrink-0 accent-[var(--color-primary)]"
              />
            )}
            <span className="truncate">{lead.name}</span>
          </h3>
          <p className="text-sm text-muted">
            {formatPhone(lead.phone)} · {lead.city}
          </p>
          {(follow && active) || stale || lead.notes || lead.temp || lead.observedAt || lead.siteKind ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {lead.temp && (
                <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-deep dark:text-primary">
                  {TEMPS.find((item) => item[0] === lead.temp)?.[1]}
                </span>
              )}
              {stale && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                  <Clock className="size-3.5" /> Sem contato há {idle} dias
                </span>
              )}
              {follow && active && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    follow === "atrasado"
                      ? "bg-danger/10 text-danger"
                      : follow === "hoje"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                        : "bg-primary-soft text-primary-deep dark:text-primary"
                  }`}
                >
                  <CalendarClock className="size-3.5" />
                  {follow === "atrasado" ? "Retorno atrasado" : follow === "hoje" ? "Retorno hoje" : `Retorno ${brDate(lead.followUp!)}`}
                </span>
              )}
              {(lead.observedAt || lead.siteKind) && (
                <ObservationBadge observedAt={lead.observedAt} showMissing />
              )}
              {lead.notes && <span className="max-w-xs truncate text-xs text-muted">{lead.notes}</span>}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lead.status}
            onChange={(event) => onStatus(lead.id, event.target.value as Status)}
            className="rounded-xl border border-border bg-surface-2 px-2.5 py-2 text-sm outline-none focus:border-primary"
          >
            {STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
          <a
            href={waLink(lead.phone, lead.name, lead.status === "novo" ? message : followMessage, lead.city)}
            target="_blank"
            rel="noreferrer"
            onClick={() => onContact(lead.id)}
            className="inline-flex items-center gap-1 rounded-xl bg-whatsapp px-3 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:brightness-105"
          >
            <MessageCircle className="size-4" /> {lead.status === "novo" ? "Falar" : "Retorno"}
          </a>
          <a href={`tel:+55${lead.phone}`} aria-label="Ligar" className={`${btnGhost} px-2.5`}>
            <PhoneCall className="size-4" />
          </a>
          <button
            type="button"
            aria-label="Copiar telefone"
            onClick={() => onCopy(lead.phone, "Telefone copiado")}
            className={`${btnGhost} px-2.5`}
          >
            <Copy className="size-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              onCopy(
                fillTemplate(lead.status === "novo" ? message : followMessage, lead.name, lead.city),
                "Mensagem copiada",
              )
            }
            className={btnGhost}
          >
            Copiar msg
          </button>
          {onAiMessage && (
            <button type="button" onClick={() => onAiMessage(lead)} disabled={Boolean(aiBusyId)} className={`${btnGhost} inline-flex items-center gap-1.5`}>
              {aiBusyId === lead.id ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Mensagem com IA
            </button>
          )}
          {onSite && (
            <button type="button" onClick={() => onSite(lead.id)} className={`${btnGhost} inline-flex items-center gap-1.5`}>
              <Sparkles className="size-4" /> Criar com IA
            </button>
          )}
          <button type="button" onClick={() => onNotes(lead.id)} className={btnGhost}>
            Notas
          </button>
          <button
            type="button"
            aria-label="Remover"
            onClick={() => onRemove(lead.id)}
            className="rounded-xl border border-border bg-surface p-2 text-danger transition hover:border-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
});

const KanbanBoard = memo(function KanbanBoard({
  rows,
  message,
  followMessage,
  today,
  onStatus,
  onNotes,
  onContact,
}: {
  rows: SavedLead[];
  message: string;
  followMessage: string;
  today: string;
  onStatus: (id: string, status: Status) => void;
  onNotes: (id: string) => void;
  onContact: (id: string) => void;
}) {
  const [over, setOver] = useState<Status | null>(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {STATUSES.map((status) => {
        const column = rows.filter((row) => row.status === status.id);
        return (
          <div
            key={status.id}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(status.id);
            }}
            onDragLeave={() => setOver((current) => (current === status.id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain");
              if (id) onStatus(id, status.id);
              setOver(null);
            }}
            className={`min-w-[230px] flex-1 rounded-2xl border p-2.5 transition ${
              over === status.id ? "border-primary bg-primary-soft" : "border-border bg-surface-2"
            }`}
          >
            <p className="mb-2 flex items-center justify-between px-1 text-sm font-bold">
              {status.label}
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">{column.length}</span>
            </p>
            <div className="space-y-2">
              {column.map((lead) => {
                const follow = followState(lead.followUp, today);
                const active = lead.status !== "fechado" && lead.status !== "perdido";
                return (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", lead.id)}
                    className="cursor-grab rounded-xl border border-border bg-surface p-3 text-sm shadow-sm active:cursor-grabbing"
                  >
                    <p className="truncate font-semibold">{lead.name}</p>
                    <p className="text-xs text-muted">{formatPhone(lead.phone)}</p>
                    {follow && active && (
                      <p className={`mt-1 text-xs font-bold ${follow === "atrasado" ? "text-danger" : "text-primary"}`}>
                        {follow === "atrasado" ? "Retorno atrasado" : follow === "hoje" ? "Retorno hoje" : `Retorno ${brDate(lead.followUp!)}`}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <a
                        href={waLink(lead.phone, lead.name, lead.status === "novo" ? message : followMessage, lead.city)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="WhatsApp"
                        onClick={() => onContact(lead.id)}
                        className="rounded-lg bg-whatsapp p-1.5 text-primary-fg"
                      >
                        <MessageCircle className="size-3.5" />
                      </a>
                      <button type="button" onClick={() => onNotes(lead.id)} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold">
                        Notas
                      </button>
                      <select
                        value={lead.status}
                        onChange={(event) => onStatus(lead.id, event.target.value as Status)}
                        className="ml-auto min-w-0 rounded-lg border border-border bg-surface-2 px-1 py-1 text-xs"
                        aria-label="Mover para"
                      >
                        {STATUSES.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </article>
                );
              })}
              {column.length === 0 && <p className="px-1 py-4 text-center text-xs text-muted">Arraste um lead para cá</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export function LeadApp() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [ready, setReady] = useState(false);
  const [city, setCity] = useState(CITIES[0]);
  const [countryCode, setCountryCode] = useState("BR");
  const [niche, setNiche] = useState("restaurante");
  const [quantity, setQuantity] = useState(10);
  const [minRating, setMinRating] = useState(4);
  const [neighborhood, setNeighborhood] = useState("");
  const [minReviews, setMinReviews] = useState(0);
  const [mobileOnly, setMobileOnly] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [broad, setBroad] = useState(false);
  const [siteMode, setSiteMode] = useState<"sem" | "social" | "todas">("social");
  const [auditLead, setAuditLead] = useState<Lead | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [nicheCustom, setNicheCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState("");
  const [results, setResults] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<SavedLead[]>([]);
  const [filter, setFilter] = useState<Status | "todos" | "retornos">("todos");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<"padrao" | "prioridade" | "nota" | "avaliacoes" | "abertas">("padrao");
  const [view, setView] = useState<"lista" | "quadro">("lista");
  const [resQuery, setResQuery] = useState("");
  const [pipeQuery, setPipeQuery] = useState("");
  const [toast, setToast] = useState("");
  const [toastAction, setToastAction] = useState<{ label: string; run: () => void } | null>(null);
  const [pipeSort, setPipeSort] = useState<"recentes" | "retorno" | "valor" | "nome">("recentes");
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", city: "", notes: "" });
  const [addError, setAddError] = useState("");
  const [goal, setGoal] = useState(0);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aiLeadDraft, setAiLeadDraft] = useState<{ lead: SavedLead; text: string } | null>(null);
  const [aiLeadBusyId, setAiLeadBusyId] = useState("");
  const [aiLeadError, setAiLeadError] = useState("");
  const [tempFilter, setTempFilter] = useState<"todas" | "quente" | "morno" | "frio">("todas");
  const [hideSaved, setHideSaved] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [annDismissed, setAnnDismissed] = useState("");
  const [trialOpen, setTrialOpen] = useState(false);
  const [trialForm, setTrialForm] = useState({ name: "", whatsapp: "" });
  const [trialBusy, setTrialBusy] = useState(false);
  const [trialError, setTrialError] = useState("");
  const dueNoticed = useRef(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusQueue, setFocusQueue] = useState<string[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [objOpen, setObjOpen] = useState(false);
  const [siteLeadId, setSiteLeadId] = useState<string | null>(null);
  const [sitePane, setSitePane] = useState<"site" | "prompt">("site");
  const [siteExtra, setSiteExtra] = useState<SavedLead | null>(null);
  const [gTicket, setGTicket] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gKey, setGKey] = useState("");
  const [gBusy, setGBusy] = useState(false);
  const [gError, setGError] = useState("");
  const [mySitesOpen, setMySitesOpen] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [installEvent, setInstallEvent] = useState<{ prompt: () => Promise<void> } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ticket, setTicket] = useState(1500);
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [followMessage, setFollowMessage] = useState(DEFAULT_FOLLOW_MSG);
  const [theme, setTheme] = useState<Theme>("light");
  const [deviceId, setDeviceId] = useState("");
  const [info, setInfo] = useState<AccessInfo | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [sync, setSync] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const versionRef = useRef(0);
  const dirtyRef = useRef(false);
  const skipSaveRef = useRef(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [step, setStep] = useState<"login" | "app">("login");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [userName, setUserName] = useState("");
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profilePhoto, setProfilePhotoState] = useState("");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchActivity[]>([]);
  const [customMessages, setCustomMessages] = useState<CustomMessage[]>([]);
  const [messageLeadId, setMessageLeadId] = useState("");
  const [messageName, setMessageName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageCategory, setMessageCategory] = useState("Primeiro contato");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [activityRange, setActivityRange] = useState<"todos" | "7" | "30">("todos");
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [integrationsBusy, setIntegrationsBusy] = useState(false);
  const [integrationRefresh, setIntegrationRefresh] = useState(0);
  const [profileBusy, setProfileBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const notify = useCallback((text: string, action?: { label: string; run: () => void }) => {
    setToast(text);
    setToastAction(action ?? null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => {
        setToast("");
        setToastAction(null);
      },
      action ? 6000 : 2200,
    );
  }, []);

  useEffect(() => {
    setPipeline(loadPipeline());
    setSearchHistory(loadSearchActivity());
    setCustomMessages(loadCustomMessages());
    setProfilePhotoState(loadProfilePhoto());
    setNotificationsEnabledState(loadNotificationsEnabled());
    setTicket(loadTicket());
    setMessage(loadMsg());
    setUserName(loadUserName());
    setProfileNameDraft(loadUserName());
    const prefs = loadPrefs();
    if (prefs) {
      setCity(prefs.city || CITIES[0]);
      setNiche(prefs.niche ?? "restaurante");
      setQuantity(prefs.quantity || 10);
      setMinRating(prefs.minRating ?? 4);
      setNeighborhood(prefs.neighborhood ?? "");
      setMinReviews(prefs.minReviews ?? 0);
      setMobileOnly(Boolean(prefs.mobileOnly));
      setOnlyOpen(Boolean(prefs.onlyOpen));
      setBroad(Boolean(prefs.broad));
      setSiteMode(prefs.siteMode ?? "social");
    }
    setFollowMessage(loadFollowMsg());
    setGoal(loadGoal());
    setDailyGoal(loadDailyGoal() || 20);
    setRecent(loadRecent());
    setAnnDismissed(loadAnnDismissed());
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    const device = getDeviceId();
    setDeviceId(device);
    const hash = window.location.hash;
    if (hash.startsWith("#glogin=") || hash.startsWith("#glink=")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      if (hash.startsWith("#glink=")) {
        const ticket = hash.slice("#glink=".length);
        setGTicket(ticket);
        setGEmail(readTicket(ticket).email);
        setReady(true);
        return;
      }
      const token = hash.slice("#glogin=".length);
      checkAccessKey({ data: { key: token, deviceId: device, bind: true } })
        .then((res) => {
          if (res.ok) {
            saveAccessKey(token);
            setAccessKey(token);
            setInfo(res.info);
            setStep("app");
          } else {
            setAuthError(accessMessage(res.code));
          }
        })
        .catch(() => setAuthError("Não consegui entrar com o Google agora. Tente de novo."))
        .finally(() => setReady(true));
      return;
    }
    const stored = loadAccessKey();
    if (!stored) {
      setReady(true);
      return;
    }
    checkAccessKey({ data: { key: stored, deviceId: device, bind: false } })
      .then((res) => {
        if (res.ok) {
          setAccessKey(stored);
          setInfo(res.info);
          setStep("app");
        } else {
          clearAccessKey();
          if (res.code !== "NAO_VINCULADO") setAuthError(accessMessage(res.code));
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) savePipeline(pipeline);
  }, [pipeline, ready]);

  useEffect(() => {
    if (ready) savePrefs({ city, niche, quantity, minRating, neighborhood, minReviews, mobileOnly, onlyOpen, broad, siteMode });
  }, [city, niche, quantity, minRating, neighborhood, minReviews, mobileOnly, onlyOpen, broad, siteMode, ready]);

  const expiresMs = info?.expiresAt ? new Date(info.expiresAt).getTime() : null;
  const isTest = info?.kind === "test";

  useEffect(() => {
    // Mantém login e painel com a mesma identidade visual.
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme, step]);

  useEffect(() => {
    if (!expiresMs) return;
    const timer = setInterval(() => setNow(Date.now()), isTest ? 1000 : 30000);
    return () => clearInterval(timer);
  }, [expiresMs, isTest]);

  useEffect(() => {
    if (expiresMs && now >= expiresMs) {
      logout(isTest ? "Seu teste acabou. Compre uma key para continuar." : "Sua key venceu. Renove para continuar.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, expiresMs]);

  // Nuvem: ao entrar, junta os leads deste aparelho com os da key.
  useEffect(() => {
    if (step !== "app" || !accessKey || !deviceId) return;
    let cancelled = false;
    loadCloud({ data: { key: accessKey, deviceId } })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (res.code !== "MUITO_GRANDE") logout(accessMessage(res.code));
          return;
        }
        versionRef.current = res.version;
        const cloud: CloudData = res.data;
        const rows = Array.isArray(cloud.pipeline) ? (cloud.pipeline as SavedLead[]) : [];
        setPipeline((local) => mergeLeads(local, rows));
        if (Array.isArray(cloud.searchHistory) && cloud.searchHistory.length) {
          setSearchHistory(cloud.searchHistory as SearchActivity[]);
          saveSearchActivity(cloud.searchHistory as SearchActivity[]);
        }
        if (Array.isArray(cloud.customMessages)) {
          setCustomMessages(cloud.customMessages as CustomMessage[]);
          saveCustomMessages(cloud.customMessages as CustomMessage[]);
        }
        if (cloud.profilePhoto) {
          setProfilePhotoState(cloud.profilePhoto);
          saveProfilePhoto(cloud.profilePhoto);
        }
        if (cloud.preferences) {
          const prefs = cloud.preferences;
          if (prefs.city) setCity(prefs.city);
          if (prefs.niche) setNiche(prefs.niche);
          if (prefs.quantity) setQuantity(prefs.quantity);
          if (typeof prefs.minRating === "number") setMinRating(prefs.minRating);
          setNeighborhood(prefs.neighborhood || "");
          if (typeof prefs.minReviews === "number") setMinReviews(prefs.minReviews);
          setMobileOnly(Boolean(prefs.mobileOnly)); setOnlyOpen(Boolean(prefs.onlyOpen)); setBroad(Boolean(prefs.broad));
          if (prefs.siteMode) setSiteMode(prefs.siteMode);
        }
        if (cloud.userName) {
          setUserName(cloud.userName);
          setProfileNameDraft(cloud.userName);
          saveUserName(cloud.userName);
        }
        if (res.version > 0) {
          if (cloud.ticket) setTicket(cloud.ticket);
          if (cloud.message) setMessage(cloud.message);
          if (cloud.followMessage) setFollowMessage(cloud.followMessage);
          if (cloud.goal) setGoal(cloud.goal);
        }
        setCloudReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSync("error");
          setCloudReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, accessKey, deviceId]);

  // Nuvem: salva 1,5 s depois da última mudança.
  useEffect(() => {
    if (!cloudReady || step !== "app") return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    dirtyRef.current = true;
    setSync("saving");
    const timer = setTimeout(async () => {
      const res = await saveCloud({
        data: {
          key: accessKey,
          deviceId,
          baseVersion: versionRef.current,
          payload: { pipeline, ticket, message, followMessage, goal, userName, profilePhoto, customMessages, searchHistory, preferences: { city, niche, quantity, minRating, neighborhood, minReviews, mobileOnly, onlyOpen, broad, siteMode } },
        },
      }).catch(() => null);
      if (!res) {
        setSync("error");
        return;
      }
      if (res.ok) {
        versionRef.current = res.version;
        dirtyRef.current = false;
        setSync("saved");
      } else if (res.conflict) {
        // Outro aparelho salvou antes: junta e salva de novo.
        versionRef.current = res.version;
        const rows = Array.isArray(res.data.pipeline) ? (res.data.pipeline as SavedLead[]) : [];
        setPipeline((local) => {
          const merged = mergeLeads(local, rows);
          return merged === local ? [...local] : merged;
        });
        if (Array.isArray(res.data.customMessages)) {
          setCustomMessages((local) => {
            const ids = new Set(local.map((item) => item.id));
            const merged = [...local, ...res.data.customMessages!.filter((item) => !ids.has(item.id))] as CustomMessage[];
            saveCustomMessages(merged);
            return merged;
          });
        }
        if (Array.isArray(res.data.searchHistory)) {
          setSearchHistory((local) => {
            const ids = new Set(local.map((item) => item.id));
            const merged = [...local, ...res.data.searchHistory!.filter((item) => !ids.has(item.id))] as SearchActivity[];
            const trimmed = merged.slice(-1000);
            saveSearchActivity(trimmed);
            return trimmed;
          });
        }
      } else {
        setSync("error");
      }
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline, ticket, message, followMessage, goal, userName, profilePhoto, customMessages, searchHistory, cloudReady, step]);

  // Nuvem: ao voltar para a aba, traz o que outro aparelho salvou.
  useEffect(() => {
    if (!cloudReady || step !== "app") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      loadCloud({ data: { key: accessKey, deviceId } })
        .then((res) => {
          if (!res.ok || res.version <= versionRef.current) return;
          versionRef.current = res.version;
          const rows = Array.isArray(res.data.pipeline) ? (res.data.pipeline as SavedLead[]) : [];
          if (dirtyRef.current) {
            setPipeline((local) => mergeLeads(local, rows));
          } else {
            skipSaveRef.current = true;
            setPipeline(rows);
            if (res.data.ticket) setTicket(res.data.ticket);
            if (res.data.message) setMessage(res.data.message);
            if (res.data.followMessage) setFollowMessage(res.data.followMessage);
            if (res.data.goal) setGoal(res.data.goal);
            if (res.data.userName) { setUserName(res.data.userName); setProfileNameDraft(res.data.userName); }
            if (res.data.profilePhoto) setProfilePhotoState(res.data.profilePhoto);
            if (Array.isArray(res.data.customMessages)) setCustomMessages(res.data.customMessages as CustomMessage[]);
            if (Array.isArray(res.data.searchHistory)) { setSearchHistory(res.data.searchHistory as SearchActivity[]); saveSearchActivity(res.data.searchHistory as SearchActivity[]); }
            if (res.data.preferences) {
              const prefs = res.data.preferences;
              if (prefs.city) setCity(prefs.city);
              if (prefs.niche) setNiche(prefs.niche);
              if (prefs.quantity) setQuantity(prefs.quantity);
              if (typeof prefs.minRating === "number") setMinRating(prefs.minRating);
              setNeighborhood(prefs.neighborhood || "");
              if (typeof prefs.minReviews === "number") setMinReviews(prefs.minReviews);
              setMobileOnly(Boolean(prefs.mobileOnly)); setOnlyOpen(Boolean(prefs.onlyOpen)); setBroad(Boolean(prefs.broad));
              if (prefs.siteMode) setSiteMode(prefs.siteMode);
            }
          }
        })
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [cloudReady, step, accessKey, deviceId]);

  useEffect(() => {
    if (step === "app" && !loadTourDone()) setTourOpen(true);
  }, [step]);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as unknown as { prompt: () => Promise<void> });
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!cloudReady || step !== "app") return;
    const load = () =>
      getAnnouncement({ data: { key: accessKey, deviceId } })
        .then((res) => setAnnouncement(res.text))
        .catch(() => undefined);
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [cloudReady, step, accessKey, deviceId]);

  useEffect(() => {
    if (!cloudReady || dueNoticed.current) return;
    dueNoticed.current = true;
    const due = pipelineRef.current.filter(
      (row) => row.followUp && row.followUp <= todayIso() && row.status !== "fechado" && row.status !== "perdido",
    ).length;
    if (due > 0) {
      notify(`Você tem ${due} retorno(s) para hoje`, { label: "Ver", run: () => setTab("hoje") });
      if (notificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Retornos do LeadHunter", { body: `Você tem ${due} retorno(s) agendado(s).` });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudReady, notificationsEnabled]);

  useEffect(() => {
    if (tab !== "integracoes" || !accessKey || !deviceId) return;
    let cancelled = false;
    setIntegrationsBusy(true);
    getIntegrationStatus({ data: { key: accessKey, deviceId } })
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setIntegrations(result);
        else notify(accessMessage(result.error));
      })
      .catch(() => { if (!cancelled) notify("Não consegui verificar as integrações agora."); })
      .finally(() => { if (!cancelled) setIntegrationsBusy(false); });
    return () => { cancelled = true; };
  }, [tab, accessKey, deviceId, integrationRefresh, notify]);

  const today = todayIso();
  const deferredPipeQuery = useDeferredValue(pipeQuery);
  const deferredResQuery = useDeferredValue(resQuery);

  const dueCount = useMemo(
    () =>
      pipeline.filter(
        (row) => row.followUp && row.followUp <= today && row.status !== "fechado" && row.status !== "perdido",
      ).length,
    [pipeline, today],
  );

  const visible = useMemo(() => {
    const q = deferredPipeQuery.trim().toLowerCase();
    const list = pipeline.filter((row) => {
      if (filter === "retornos") {
        if (!row.followUp || row.followUp > today || row.status === "fechado" || row.status === "perdido") return false;
      } else if (filter !== "todos" && row.status !== filter) return false;
      if (tempFilter !== "todas" && row.temp !== tempFilter) return false;
      if (!q) return true;
      return `${row.name} ${row.phone} ${row.city} ${row.notes}`.toLowerCase().includes(q);
    });
    if (pipeSort === "retorno") list.sort((a, b) => (a.followUp || "9999").localeCompare(b.followUp || "9999"));
    if (pipeSort === "valor") list.sort((a, b) => (b.value || 0) - (a.value || 0));
    if (pipeSort === "nome") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [pipeline, filter, deferredPipeQuery, today, pipeSort, tempFilter]);

  // Tela "Hoje": o que fazer agora.
  const todayLists = useMemo(() => {
    const active = pipeline.filter((row) => row.status !== "fechado" && row.status !== "perdido");
    const due = active
      .filter((row) => row.followUp && row.followUp <= today)
      .sort((a, b) => a.followUp!.localeCompare(b.followUp!));
    const stale = active.filter(
      (row) =>
        row.status !== "novo" &&
        !(row.followUp && row.followUp <= today) &&
        row.lastContact &&
        daysSince(row.lastContact) >= 3,
    );
    const fresh = active.filter((row) => row.status === "novo").slice(0, 10);
    return { due, stale, fresh };
  }, [pipeline, today]);

  const sendStats = useMemo(() => {
    const days = new Set<string>();
    const todayStr = todayIso();
    let todayCount = 0;
    for (const row of pipeline) {
      for (const item of row.history ?? []) {
        if (!item.text.startsWith("Mensagem ")) continue;
        const day = new Date(item.at).toLocaleDateString("sv-SE");
        days.add(day);
        if (day === todayStr) todayCount += 1;
      }
    }
    let streak = 0;
    const cursor = new Date();
    if (!days.has(todayStr)) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toLocaleDateString("sv-SE"))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { todayCount, streak };
  }, [pipeline]);

  const week = useMemo(() => {
    const since = Date.now() - 7 * 86400000;
    const at = (iso?: string) => (iso ? new Date(iso).getTime() : 0);
    const closedWeek = pipeline.filter((row) => row.status === "fechado" && at(row.closedAt) >= since);
    return {
      added: pipeline.filter((row) => at(row.addedAt) >= since).length,
      contacted: pipeline.filter((row) => at(row.lastContact) >= since).length,
      closed: closedWeek.length,
      revenue: closedWeek.reduce((sum, row) => sum + (row.value || ticket), 0),
    };
  }, [pipeline, ticket]);

  const cityStats = useMemo(() => {
    const map = new Map<string, { city: string; leads: number; closed: number; revenue: number }>();
    for (const row of pipeline) {
      const name = (row.city || "—").split(",")[0].trim() || "—";
      const item = map.get(name) ?? { city: name, leads: 0, closed: 0, revenue: 0 };
      item.leads += 1;
      if (row.status === "fechado") {
        item.closed += 1;
        item.revenue += row.value || ticket;
      }
      map.set(name, item);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.closed - a.closed || b.leads - a.leads).slice(0, 5);
  }, [pipeline, ticket]);

  const totalFound = searchHistory.reduce((sum, item) => sum + item.count, 0);
  const proposalsSent = pipeline.reduce((sum, row) => sum + (row.history?.filter((item) => /proposta gerada/i.test(item.text)).length ?? 0), 0);
  const contactsMade = pipeline.reduce((sum, row) => sum + (row.history?.filter((item) => /Contato pelo WhatsApp|Mensagem \d+ enviada/i.test(item.text)).length ?? 0), 0);
  const activityItems = useMemo(() => {
    const query = activityQuery.trim().toLowerCase();
    const cutoff = activityRange === "todos" ? 0 : Date.now() - Number(activityRange) * 86_400_000;
    const leadEvents = pipeline.flatMap((row) => [
      { id: `saved-${row.id}`, at: row.addedAt, company: row.name, city: row.city, text: "Lead salvo" },
      ...(row.history ?? []).map((item, index) => ({ id: `${row.id}-${index}`, at: item.at, company: row.name, city: row.city, text: item.text })),
    ]);
    const searches = searchHistory.flatMap((item) => item.businesses?.length
      ? item.businesses.map((company, index) => ({
          id: item.id + "-" + index,
          at: item.at,
          company,
          city: item.city,
          text: "Encontrada na busca de " + item.niche,
        }))
      : [{
          id: item.id,
          at: item.at,
          company: "Busca: " + item.niche,
          city: item.city,
          text: item.count + " empresas encontradas",
        }]);
    return [...leadEvents, ...searches]
      .filter((item) => Number.isFinite(new Date(item.at).getTime()) && new Date(item.at).getTime() >= cutoff)
      .filter((item) => !query || `${item.company} ${item.city} ${item.text}`.toLowerCase().includes(query))
      .sort((x, y) => y.at.localeCompare(x.at))
      .slice(0, 500);
  }, [pipeline, searchHistory, activityQuery, activityRange]);
  const searchDays = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
      const key = day.toLocaleDateString("sv-SE");
      return { key, label: day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), count: 0 };
    });
    for (const item of searchHistory) {
      const day = days.find((entry) => entry.key === item.at.slice(0, 10));
      if (day) day.count += item.count;
    }
    return days;
  }, [searchHistory]);
  const reportCities = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of pipeline) {
      const name = (row.city || "Sem cidade").split(",")[0].trim() || "Sem cidade";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count).slice(0, 10);
  }, [pipeline]);
  const segmentStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of pipeline) map.set(row.category || "Sem segmento", (map.get(row.category || "Sem segmento") ?? 0) + 1);
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count).slice(0, 8);
  }, [pipeline]);
  const opportunities = useMemo(() => {
    const score = (row: SavedLead) => {
      const rating = (Math.min(row.rating || 0, 5) / 5) * 40;
      const reviews = Math.min(Math.log10((row.reviews || 0) + 1) / Math.log10(500), 1) * 30;
      const noSite = row.siteKind === "none" ? 20 : row.siteKind === "social" ? 12 : 0;
      const mobile = row.phone.length === 11 && row.phone[2] === "9" ? 10 : 3;
      return Math.round(rating + reviews + noSite + mobile);
    };
    return pipeline
      .filter((row) => row.siteKind !== "site" && row.status !== "fechado" && row.status !== "perdido")
      .map((row) => ({ row, score: score(row) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, 30);
  }, [pipeline]);
  const months = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        total: 0,
      });
    }
    for (const row of pipeline) {
      if (row.status !== "fechado") continue;
      const key = (row.closedAt || row.addedAt).slice(0, 7);
      const slot = list.find((item) => item.key === key);
      if (slot) slot.total += row.value || ticket;
    }
    return list;
  }, [pipeline, ticket]);

  const shownResults = useMemo(() => {
    const q = deferredResQuery.trim().toLowerCase();
    const known = hideSaved ? new Set(pipeline.flatMap((row) => [row.id, row.phone])) : null;
    let rows = results.filter((lead) => {
      if (openOnly && lead.openNow !== true) return false;
      if (known && (known.has(lead.id) || known.has(lead.phone))) return false;
      return !q || `${lead.name} ${lead.category} ${lead.address}`.toLowerCase().includes(q);
    });
    if (sort === "prioridade") rows = [...rows].sort((x, y) => leadScore(y) - leadScore(x));
    if (sort === "nota") rows = [...rows].sort((x, y) => y.rating - x.rating || y.reviews - x.reviews);
    if (sort === "avaliacoes") rows = [...rows].sort((x, y) => y.reviews - x.reviews);
    if (sort === "abertas") {
      const rank = (lead: Lead) => (lead.openNow === true ? 0 : lead.openNow === null ? 1 : 2);
      rows = [...rows].sort((x, y) => rank(x) - rank(y));
    }
    return rows;
  }, [results, openOnly, deferredResQuery, sort, hideSaved, pipeline]);

  const suggested = useMemo(() => suggestTemplate(niche), [niche]);
  const outreachLanguage = countryCode === "ES" || countryCode === "MX" ? "es" : countryCode === "PT" ? "pt" : countryCode === "BR" ? "pt" : "en";
  const outreachTemplates = outreachLanguage === "pt" ? FIRST_TEMPLATES : INTERNATIONAL_TEMPLATES[outreachLanguage] || INTERNATIONAL_TEMPLATES.en;
  const openCount = useMemo(() => results.filter((lead) => lead.openNow === true).length, [results]);
  const savedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const row of pipeline) {
      set.add(row.id);
      if (row.phone) set.add(row.phone);
    }
    return set;
  }, [pipeline]);

  const closed = pipeline.filter((row) => row.status === "fechado");
  const salesWonRate = pipeline.length ? Math.round((closed.length / pipeline.length) * 100) : 0;
  const negotiating = pipeline
    .filter((row) => row.status === "proposta")
    .reduce((sum, row) => sum + (row.value || ticket), 0);
  const revenue = closed.reduce((sum, row) => sum + (row.value || ticket), 0);
  const conversion = pipeline.length ? Math.round((closed.length / pipeline.length) * 100) : 0;

  async function onSearch() {
    if (loading) return;
    if (!city.trim()) {
      setError("Digite o nome da cidade.");
      return;
    }
    setError("");
    setMeta("");
    setResQuery("");
    setLoading(true);
    try {
      const result = await searchPlaces({
        data: { city, countryCode, niche, neighborhood, minReviews, mobileOnly, openOnly: onlyOpen, broad, siteMode, minRating, quantity, accessKey, deviceId },
      });
      if (!result.ok) {
        setResults([]);
        if (["KEY_INVALIDA", "KEY_REVOGADA", "KEY_EXPIRADA", "APARELHOS", "NAO_VINCULADO"].includes(result.error)) {
          logout(accessMessage(result.error));
          return;
        }
        if (result.error === "LIMITE_DIARIO") {
          setInfo((prev) => (prev ? { ...prev, usedToday: prev.dailyLimit } : prev));
          setError("Você usou todas as buscas de hoje. Elas voltam amanhã de manhã.");
          return;
        }
        setError(result.error);
        return;
      }
      setResults(result.leads);
      const searchEntry: SearchActivity = { id: `search-${Date.now()}`, at: new Date().toISOString(), city, niche, count: result.leads.length, businesses: result.leads.slice(0, 25).map((row) => row.name) };
      setSearchHistory((prev) => {
        const next = [...prev, searchEntry].slice(-1000);
        saveSearchActivity(next);
        return next;
      });
      setRecent((prev) => {
        const next = [{ city, niche }, ...prev.filter((item) => !(item.city === city && item.niche === niche))].slice(0, 6);
        saveRecent(next);
        return next;
      });
      setInfo((prev) => (prev ? { ...prev, usedToday: result.usage.used, dailyLimit: result.usage.limit } : prev));
      setMeta(
        result.leads.length < result.asked
          ? `Pediu ${result.asked} e o Google só tinha ${result.leads.length} sem site com telefone nesta busca (${result.scanned} lidos, ${result.withSite} já tinham site). Tente outro nicho, tire algum filtro de "Mais opções" ou ative a busca ampla.`
          : `${result.leads.length} leads sem site. ${result.withSite} com site foram ignorados.`,
      );
      if (!result.leads.length) {
        setError("Nenhuma empresa sem site com telefone nessa busca. Tente outro nicho, baixe a nota mínima, tire filtros de \"Mais opções\" ou use a busca ampla.");
      }
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Falha na busca.");
    } finally {
      setLoading(false);
    }
  }

  const pipelineRef = useRef(pipeline);
  pipelineRef.current = pipeline;

  const keep = useCallback(
    (lead: Lead) => {
      setPipeline((rows) => {
        if (rows.some((row) => row.id === lead.id || (row.phone && row.phone === lead.phone))) return rows;
        return [
          {
            ...lead,
            city,
            status: "novo",
            notes: "",
            value: ticket,
            addedAt: new Date().toISOString(),
            history: [{ at: new Date().toISOString(), text: "Adicionado ao pipeline" }],
          },
          ...rows,
        ];
      });
      notify("Guardado no pipeline");
    },
    [city, ticket, notify],
  );

  function keepAll() {
    const fresh = shownResults.filter((lead) => !savedKeys.has(lead.id) && !savedKeys.has(lead.phone));
    if (!fresh.length) {
      notify("Todos já estão no pipeline");
      return;
    }
    setPipeline((rows) => [
      ...fresh.map((lead) => ({
        ...lead,
        city,
        status: "novo" as Status,
        notes: "",
        value: ticket,
        addedAt: new Date().toISOString(),
        history: [{ at: new Date().toISOString(), text: "Adicionado ao pipeline" }],
      })),
      ...rows,
    ]);
    notify(`${fresh.length} guardados no pipeline`);
  }

  const setStatus = useCallback((id: string, status: Status) => {
    setPipeline((rows) => rows.map((row) => (row.id === id ? applyStatus(row, status) : row)));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openSiteEditor = useCallback((id: string) => {
    setSiteExtra(null);
    setSitePane("site");
    setSiteLeadId(id);
  }, []);

  const promptFromLead = useCallback(
    (lead: Lead) => {
      setSiteExtra({ ...lead, city, status: "novo", notes: "", value: ticket, addedAt: new Date().toISOString() } as SavedLead);
      setSitePane("prompt");
      setSiteLeadId(lead.id);
    },
    [city, ticket],
  );

  async function submitGoogleLink() {
    setGBusy(true);
    setGError("");
    try {
      const res = await linkGoogle({ data: { ticket: gTicket, key: gKey, deviceId } });
      if (!res.ok) {
        setGError(res.error);
        return;
      }
      const who = readTicket(gTicket);
      if (who.name && !loadUserName()) {
        saveUserName(who.name);
        setUserName(who.name);
        setProfileNameDraft(who.name);
      }
      saveAccessKey(res.token);
      setAccessKey(res.token);
      setInfo(res.info);
      setNow(Date.now());
      setGTicket("");
      setGKey("");
      setStep("app");
    } catch {
      setGError("Não consegui falar com o servidor. Tente de novo.");
    } finally {
      setGBusy(false);
    }
  }

  function startFocus() {
    const todayStr = todayIso();
    const active = pipelineRef.current.filter((row) => row.status !== "fechado" && row.status !== "perdido");
    const due = active.filter((row) => row.followUp && row.followUp <= todayStr);
    const dueIds = new Set(due.map((row) => row.id));
    const stale = active.filter(
      (row) => !dueIds.has(row.id) && row.status !== "novo" && row.lastContact && daysSince(row.lastContact) >= 3,
    );
    const fresh = active.filter((row) => row.status === "novo" && !dueIds.has(row.id));
    const ids = [...due, ...stale, ...fresh].map((row) => row.id).slice(0, 50);
    if (!ids.length) {
      notify("Nenhum lead na fila. Guarde leads no pipeline primeiro.");
      return;
    }
    setFocusQueue(ids);
    setFocusIndex(0);
    setFocusOpen(true);
  }

  function focusNext() {
    setFocusIndex((index) => index + 1);
  }

  function focusSent(id: string) {
    setPipeline((rows) => rows.map((row) => (row.id === id ? sendRow(row) : row)));
    focusNext();
  }

  function focusReplied(id: string) {
    setPipeline((rows) =>
      rows.map((row) => (row.id === id ? { ...applyStatus(row, "proposta"), followUp: addDaysIso(2) } : row)),
    );
    focusNext();
  }

  function focusLost(id: string) {
    setStatus(id, "perdido");
    focusNext();
  }

  function toggleSelectAll() {
    const everyone = visible.length > 0 && visible.every((row) => selected.has(row.id));
    setSelected(everyone ? new Set() : new Set(visible.map((row) => row.id)));
  }

  function bulkStatus(status: Status) {
    const ids = selected;
    setPipeline((rows) => rows.map((row) => (ids.has(row.id) ? applyStatus(row, status) : row)));
    notify(`${ids.size} lead(s) movidos`);
    setSelected(new Set());
  }

  function bulkRemove() {
    const ids = selected;
    const removed = pipelineRef.current.filter((row) => ids.has(row.id));
    if (!removed.length) return;
    setPipeline((rows) => rows.filter((row) => !ids.has(row.id)));
    setSelected(new Set());
    notify(`${removed.length} lead(s) removidos`, {
      label: "Desfazer",
      run: () =>
        setPipeline((rows) => [...removed.filter((row) => !rows.some((item) => item.id === row.id)), ...rows]),
    });
  }

  function setTemp(id: string, temp: "quente" | "morno" | "frio" | undefined) {
    setPipeline((rows) =>
      rows.map((row) =>
        row.id === id
          ? addHistory({ ...row, temp }, temp ? `Temperatura: ${temp}` : "Temperatura removida")
          : row,
      ),
    );
  }

  function downloadBackup() {
    const payload = {
      app: "leadhunter",
      version: 1,
      savedAt: new Date().toISOString(),
      pipeline,
      ticket,
      message,
      followMessage,
      goal,
      dailyGoal,
      recent,
      searchHistory,
      customMessages,
      preferences: { city, niche, quantity, minRating, neighborhood, minReviews, mobileOnly, onlyOpen, broad, siteMode },
      theme,
      userName,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leadhunter-backup-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Backup baixado");
  }

  async function restoreBackup(file: File) {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("tamanho");
      const data = JSON.parse(await file.text()) as { app?: string; version?: number; pipeline?: unknown[] };
      if (data?.app !== "leadhunter" || !Array.isArray(data.pipeline) || data.pipeline.length > 5000) {
        throw new Error("formato");
      }
      const statuses: Status[] = ["novo", "contatado", "aguardando", "interessado", "proposta", "fechado", "perdido"];
      const safeUrl = (value: unknown) => {
        if (typeof value !== "string") return null;
        try {
          const url = new URL(value);
          return url.protocol === "https:" ? url.toString() : null;
        } catch {
          return null;
        }
      };
      const valid = data.pipeline.flatMap((item, index): SavedLead[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<SavedLead>;
        if (typeof row.name !== "string" || typeof row.phone !== "string") return [];
        const name = row.name.trim().slice(0, 160);
        const phone = row.phone.replace(/\D/g, "").slice(0, 20);
        if (name.length < 2 || phone.length < 8) return [];
        const status = statuses.includes(row.status as Status) ? row.status as Status : "novo";
        const history = Array.isArray(row.history)
          ? row.history.slice(-100).flatMap((entry) =>
              entry && typeof entry.at === "string" && typeof entry.text === "string"
                ? [{ at: entry.at.slice(0, 40), text: entry.text.slice(0, 500) }]
                : [],
            )
          : [];
        return [{
          id: typeof row.id === "string" && row.id.length <= 120 ? row.id : `restore-${Date.now()}-${index}`,
          name,
          category: typeof row.category === "string" ? row.category.slice(0, 120) : "",
          phone,
          rating: Number.isFinite(Number(row.rating)) ? Math.max(0, Math.min(5, Number(row.rating))) : 0,
          reviews: Number.isFinite(Number(row.reviews)) ? Math.max(0, Math.floor(Number(row.reviews))) : 0,
          address: typeof row.address === "string" ? row.address.slice(0, 300) : "",
          mapsUrl: safeUrl(row.mapsUrl),
          city: typeof row.city === "string" ? row.city.slice(0, 120) : "",
          status,
          notes: typeof row.notes === "string" ? row.notes.slice(0, 3000) : "",
          value: Number.isFinite(Number(row.value)) ? Math.max(0, Number(row.value)) : 0,
          addedAt: typeof row.addedAt === "string" ? row.addedAt.slice(0, 40) : new Date().toISOString(),
          followUp: typeof row.followUp === "string" ? row.followUp.slice(0, 10) : undefined,
          lastContact: typeof row.lastContact === "string" ? row.lastContact.slice(0, 40) : undefined,
          closedAt: typeof row.closedAt === "string" ? row.closedAt.slice(0, 40) : undefined,
          history,
          temp: row.temp === "quente" || row.temp === "morno" || row.temp === "frio" ? row.temp : undefined,
          step: Number.isFinite(Number(row.step)) ? Math.max(0, Math.min(20, Math.floor(Number(row.step)))) : undefined,
          website: safeUrl(row.website),
          siteKind: row.siteKind === "site" || row.siteKind === "social" || row.siteKind === "none" ? row.siteKind : undefined,
          observedAt: typeof row.observedAt === "string" ? row.observedAt.slice(0, 40) : undefined,
        }];
      });
      if (!valid.length && data.pipeline.length) throw new Error("sem leads válidos");
      setPipeline((current) => mergeLeads(current, valid));

      if (Number.isFinite(Number((data as { ticket?: unknown }).ticket))) {
        const restoredTicket = Math.max(0, Math.min(100000000, Number((data as { ticket?: unknown }).ticket)));
        setTicket(restoredTicket);
        saveTicket(restoredTicket);
      }
      const backup = data as {
        message?: unknown; followMessage?: unknown; goal?: unknown; dailyGoal?: unknown;
        recent?: unknown; searchHistory?: unknown; customMessages?: unknown; theme?: unknown;
        userName?: unknown; preferences?: Record<string, unknown>;
      };
      if (typeof backup.message === "string") { setMessage(backup.message.slice(0, 5000)); saveMsg(backup.message.slice(0, 5000)); }
      if (typeof backup.followMessage === "string") { setFollowMessage(backup.followMessage.slice(0, 5000)); saveFollowMsg(backup.followMessage.slice(0, 5000)); }
      if (Number.isFinite(Number(backup.goal))) { const value = Math.max(0, Math.min(1000000, Number(backup.goal))); setGoal(value); saveGoal(value); }
      if (Number.isFinite(Number(backup.dailyGoal))) { const value = Math.max(1, Math.min(10000, Number(backup.dailyGoal))); setDailyGoal(value); saveDailyGoal(value); }
      if (Array.isArray(backup.recent)) {
        const rows = backup.recent.slice(0, 6).flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const row = item as { city?: unknown; niche?: unknown };
          return typeof row.city === "string" && typeof row.niche === "string"
            ? [{ city: row.city.slice(0, 120), niche: row.niche.slice(0, 80) }]
            : [];
        });
        setRecent(rows); saveRecent(rows);
      }
      if (Array.isArray(backup.searchHistory)) {
        const rows = backup.searchHistory.slice(-1000).flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const row = item as Partial<SearchActivity>;
          return typeof row.id === "string" && typeof row.at === "string" && typeof row.city === "string" && typeof row.niche === "string"
            ? [{ id: row.id.slice(0, 120), at: row.at.slice(0, 40), city: row.city.slice(0, 120), niche: row.niche.slice(0, 80), count: Math.max(0, Math.floor(Number(row.count) || 0)), businesses: Array.isArray(row.businesses) ? row.businesses.filter((name): name is string => typeof name === "string").slice(0, 25).map((name) => name.slice(0, 160)) : [] }]
            : [];
        });
        setSearchHistory(rows); saveSearchActivity(rows);
      }
      if (Array.isArray(backup.customMessages)) {
        const rows = backup.customMessages.slice(0, 100).flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const row = item as Partial<CustomMessage>;
          return typeof row.id === "string" && typeof row.name === "string" && typeof row.text === "string" && typeof row.category === "string"
            ? [{ id: row.id.slice(0, 120), name: row.name.slice(0, 100), text: row.text.slice(0, 5000), category: row.category.slice(0, 100) }]
            : [];
        });
        setCustomMessages(rows); saveCustomMessages(rows);
      }
      if (backup.theme === "light" || backup.theme === "dark") { setTheme(backup.theme); saveTheme(backup.theme); }
      if (typeof backup.userName === "string") { const value = backup.userName.trim().slice(0, 100); setUserName(value); setProfileNameDraft(value); saveUserName(value); }
      if (backup.preferences && typeof backup.preferences === "object") {
        const prefs = backup.preferences;
        const restored = {
          city: typeof prefs.city === "string" ? prefs.city.slice(0, 120) : CITIES[0],
          niche: typeof prefs.niche === "string" ? prefs.niche.slice(0, 80) : "restaurante",
          quantity: Math.max(1, Math.min(60, Math.floor(Number(prefs.quantity) || 10))),
          minRating: Math.max(0, Math.min(5, Number(prefs.minRating) || 0)),
          neighborhood: typeof prefs.neighborhood === "string" ? prefs.neighborhood.slice(0, 120) : "",
          minReviews: Math.max(0, Math.min(100000, Math.floor(Number(prefs.minReviews) || 0))),
          mobileOnly: Boolean(prefs.mobileOnly), onlyOpen: Boolean(prefs.onlyOpen), broad: Boolean(prefs.broad),
          siteMode: prefs.siteMode === "sem" || prefs.siteMode === "todas" ? prefs.siteMode : "social" as const,
        };
        setCity(restored.city); setNiche(restored.niche); setQuantity(restored.quantity); setMinRating(restored.minRating);
        setNeighborhood(restored.neighborhood); setMinReviews(restored.minReviews); setMobileOnly(restored.mobileOnly);
        setOnlyOpen(restored.onlyOpen); setBroad(restored.broad); setSiteMode(restored.siteMode); savePrefs(restored);
      }
      notify(`Backup restaurado: ${valid.length} leads válidos e dados complementares recuperados${data.pipeline.length > valid.length ? `, ${data.pipeline.length - valid.length} leads ignorados` : ""}`);
    } catch {
      notify("Backup inválido. Use um arquivo exportado pelo LeadHunter com até 10 MB.");
    }
  }

  async function submitTrial() {
    setTrialBusy(true);
    setTrialError("");
    try {
      const res = await requestTrial({
        data: { name: trialForm.name, whatsapp: trialForm.whatsapp, deviceId },
      });
      if (!res.ok) {
        setTrialError(res.error);
        return;
      }
      saveUserName(trialForm.name);
      setUserName(trialForm.name.trim());
      setProfileNameDraft(trialForm.name.trim());
      await submitKey(res.key);
    } catch {
      setTrialError("Não consegui falar com o servidor. Tente de novo.");
    } finally {
      setTrialBusy(false);
    }
  }

  async function draftAiLeadMessage(lead: SavedLead) {
    if (aiLeadBusyId) return;
    setAiLeadBusyId(lead.id);
    setAiLeadError("");
    try {
      const res = await aiLeadMessage({
        data: {
          key: accessKey,
          deviceId,
          sellerName: userName,
          lead: { name: lead.name, category: lead.category, city: lead.city, status: lead.status, notes: lead.notes },
        },
      });
      if (!res.ok) {
        if (ACCESS_ERRORS.includes(res.error)) logout(accessMessage(res.error));
        else {
          setAiLeadError(res.error);
          notify(res.error);
        }
        return;
      }
      setAiLeadDraft({ lead, text: res.message });
    } catch {
      const message = "Não consegui gerar a mensagem agora. Tente novamente.";
      setAiLeadError(message);
      notify(message);
    } finally {
      setAiLeadBusyId("");
    }
  }

  const markContact = useCallback((id: string) => {
    const stamp = new Date().toISOString();
    setPipeline((rows) =>
      rows.map((row) => (row.id === id ? addHistory({ ...row, lastContact: stamp }, "Contato pelo WhatsApp", stamp) : row)),
    );
  }, []);

  const removeLead = useCallback(
    (id: string) => {
      const list = pipelineRef.current;
      const index = list.findIndex((row) => row.id === id);
      if (index < 0) return;
      const removed = list[index];
      setPipeline((rows) => rows.filter((row) => row.id !== id));
      notify(`${removed.name} removido`, {
        label: "Desfazer",
        run: () =>
          setPipeline((rows) =>
            rows.some((row) => row.id === removed.id)
              ? rows
              : [...rows.slice(0, index), removed, ...rows.slice(index)],
          ),
      });
    },
    [notify],
  );

  const copyText = useCallback(
    (text: string, label: string) => {
      navigator.clipboard
        ?.writeText(text)
        .then(() => notify(label))
        .catch(() => notify("Não consegui copiar"));
    },
    [notify],
  );

  function addManual() {
    const name = addForm.name.trim();
    const phone = normalizePhone(addForm.phone);
    if (name.length < 2) {
      setAddError("Digite o nome da empresa.");
      return;
    }
    if (!phone) {
      setAddError("Digite o telefone com DDD (10 ou 11 números).");
      return;
    }
    if (pipeline.some((row) => row.phone === phone)) {
      setAddError("Esse telefone já está no pipeline.");
      return;
    }
    setPipeline((rows) => [
      {
        id: `manual-${Date.now()}`,
        name,
        category: "Manual",
        phone,
        rating: 0,
        reviews: 0,
        address: "",
        mapsUrl: null,
        city: addForm.city.trim() || city,
        status: "novo",
        notes: addForm.notes.trim(),
        value: ticket,
        addedAt: new Date().toISOString(),
      },
      ...rows,
    ]);
    setAddForm({ name: "", phone: "", city: "", notes: "" });
    setAddError("");
    setAdding(false);
    notify("Lead adicionado");
  }

  async function importCsv(file: File) {
    const text = await file.text().catch(() => "");
    const { leads, skipped } = leadsFromCsv(text, city, ticket);
    const known = new Set(pipelineRef.current.map((row) => row.phone));
    const fresh = leads.filter((lead) => !known.has(lead.phone));
    const ignored = skipped + (leads.length - fresh.length);
    if (fresh.length) setPipeline((rows) => [...fresh, ...rows]);
    notify(
      fresh.length
        ? `${fresh.length} importados${ignored ? `, ${ignored} ignorados` : ""}`
        : "Nenhum lead novo no arquivo (precisa de nome e telefone)",
    );
  }

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt().catch(() => undefined);
    setInstallEvent(null);
  }

  async function submitKey(override?: string) {
    const key = (override ?? keyInput).trim();
    const registering = !override && mode === "register";
    if (registering && nameInput.trim().length < 2) {
      setAuthError("Digite seu nome para registrar.");
      return;
    }
    if (key.replace(/[^A-Za-z0-9]/g, "").length !== 18) {
      setAuthError("A key tem 18 caracteres, no formato LH-XXXX-XXXX-XXXX-XXXX.");
      return;
    }
    setChecking(true);
    setAuthError("");
    try {
      const res = await checkAccessKey({ data: { key, deviceId, bind: true } });
      if (!res.ok) {
        setAuthError(accessMessage(res.code));
        return;
      }
      saveAccessKey(key);
      setAccessKey(key);
      setInfo(res.info);
      setNow(Date.now());
      if (registering) {
        saveUserName(nameInput);
        setUserName(nameInput.trim());
        setProfileNameDraft(nameInput.trim());
      }
      setKeyInput("");
      setStep("app");
    } catch {
      setAuthError("Não consegui falar com o servidor. Confira a internet e tente de novo (ou abra /api/saude).");
    } finally {
      setChecking(false);
    }
  }

  function logout(message = "") {
    clearAccessKey();
    clearLocalData();
    setAccessKey("");
    setInfo(null);
    setPipeline([]);
    setSelected(new Set());
    setAnnouncement("");
    dueNoticed.current = false;
    setResults([]);
    setGoal(0);
    setCloudReady(false);
    setSync("idle");
    versionRef.current = 0;
    dirtyRef.current = false;
    setKeyInput("");
    setAuthError(message);
    setStep("login");
  }

  async function logoutAndSave() {
    if (cloudReady && dirtyRef.current) {
      await saveCloud({
        data: {
          key: accessKey,
          deviceId,
          baseVersion: versionRef.current,
          payload: { pipeline, ticket, message, followMessage, goal, userName, profilePhoto, customMessages, searchHistory, preferences: { city, niche, quantity, minRating, neighborhood, minReviews, mobileOnly, onlyOpen, broad, siteMode } },
        },
      }).catch(() => null);
    }
    logout();
  }

  async function toggleNotifications() {
    if (!notificationsEnabled) {
      if (typeof Notification === "undefined") {
        notify("Seu navegador não oferece notificações neste dispositivo.");
        return;
      }
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        notify("Permita notificações no navegador para ativar os lembretes.");
        return;
      }
    }
    const next = !notificationsEnabled;
    setNotificationsEnabledState(next);
    saveNotificationsEnabled(next);
    if (next && typeof Notification !== "undefined" && Notification.permission === "granted" && dueCount > 0) {
      new Notification("Retornos do LeadHunter", { body: "Você tem " + dueCount + " retorno(s) agendado(s)." });
    }
    notify(next ? "Lembretes ativados" : "Lembretes desativados");
  }

  async function updateProfilePhoto(file?: File) {
    if (!file) return;
    setProfileBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const photo = canvas.toDataURL("image/webp", 0.82);
      if (photo.length > 240_000) throw new Error("size");
      setProfilePhotoState(photo);
      saveProfilePhoto(photo);
      notify("Foto de perfil atualizada");
    } catch {
      notify("Não consegui preparar a imagem. Use uma foto menor em JPG, PNG ou WEBP.");
    } finally {
      setProfileBusy(false);
    }
  }

  function saveProfile() {
    const clean = profileNameDraft.trim().slice(0, 100);
    if (!clean) {
      notify("Digite seu nome antes de salvar.");
      return;
    }
    setUserName(clean);
    setProfileNameDraft(clean);
    saveUserName(clean);
    notify("Perfil atualizado");
  }

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
  }

  const open = pipeline.find((row) => row.id === openId) ?? null;

  if (!ready) return <main className="min-h-screen" />;

  if (step !== "app") {
    return (
      <main className="login-shell relative flex min-h-screen items-center justify-center overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-[-8rem] size-80 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 bottom-[-7rem] size-96 rounded-full bg-sky-300/15 blur-3xl" aria-hidden />
        <div className="login-layout relative grid w-full max-w-6xl gap-4 lg:min-h-[740px] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="login-story relative hidden flex-col justify-between overflow-hidden rounded-[2rem] p-8 text-white shadow-card lg:flex xl:p-10">
            <div className="login-orb login-orb-one" aria-hidden />
            <div className="login-orb login-orb-two" aria-hidden />
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-inner backdrop-blur">
                <BrandMark className="size-6" />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">LeadHunter</p>
                <p className="text-xs font-medium text-white/60">Prospecção local</p>
              </div>
            </div>
            <div className="relative z-10 mt-8 max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-sky-100">
                <Sparkles className="size-3.5" /> Oportunidades locais, em um só lugar
              </p>
              <h2 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
                Seu próximo cliente pode estar <span className="text-violet-300">sem site.</span>
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/70">
                Encontre empresas, organize os contatos e acompanhe cada oportunidade até a criação do site.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Encontrar", "Busque por cidade e nicho."],
                  ["02", "Acompanhar", "Organize contatos e retornos."],
                  ["03", "Apresentar", "Crie sites para seus leads."],
                ].map(([number, title, detail]) => (
                  <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
                    <span className="text-xs font-extrabold tracking-[0.14em] text-sky-300">{number}</span>
                    <p className="mt-2 text-sm font-bold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/55">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="login-demo-card relative z-10 ml-auto mt-8 w-full max-w-sm rounded-2xl border border-white/10 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-violet-200">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Exemplo de oportunidade</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-white">Negócio local</p>
                </div>
                <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-[10px] font-bold text-amber-200">Sem site</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-white/60">Prioridade de contato</span>
                <span className="font-bold text-sky-200">84 / 100</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-violet-300 to-purple-300" />
              </div>
            </div>
          </section>
          <section className={`login-panel relative flex flex-col justify-center p-5 sm:p-8 lg:p-10 ${card}`}>
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-deep text-primary-fg shadow-lg">
                <BrandMark className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">LeadHunter</p>
                <p className="text-xs text-muted">Prospecção local</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {mode === "login" ? "Bem-vinda de volta" : "Primeiro acesso"}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {mode === "login" ? "Acesse seu painel" : "Ative seu acesso"}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                {mode === "login"
                  ? "Entre para encontrar novos leads e acompanhar seus contatos."
                  : "Informe seu nome e a chave recebida para ativar sua conta."}
              </p>
            </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-primary-soft p-1">
            {(
              [
                ["login", "Entrar", LogIn],
                ["register", "Primeiro acesso", UserPlus],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setAuthError("");
                  setShowKey(false);
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  mode === id ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <p className="mb-5 text-sm leading-6 text-muted">
            {mode === "login"
              ? "Use a chave de acesso que você recebeu na compra."
              : "Informe seu nome e a chave para começar a usar o painel."}
          </p>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submitKey();
            }}
          >
            {mode === "register" && (
              <label className="block text-sm">
                <span className="mb-1.5 block font-semibold">Seu nome</span>
                <input
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Como quer ser chamado"
                  className={field}
                  autoComplete="name"
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Chave de acesso</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(event) => setKeyInput(formatKey(event.target.value))}
                  placeholder="LH-XXXX-XXXX-XXXX-XXXX"
                  className={`${field} pl-11 pr-20 font-mono tracking-wider`}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-muted transition hover:bg-primary-soft hover:text-primary"
                  aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
                >
                  {showKey ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">Sua chave só é usada para validar este acesso.</p>
            </label>
            {authError && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{authError}</p>
            )}
            <button type="submit" disabled={checking} className={`h-12 w-full ${btnPrimary}`}>
              {checking ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {mode === "login" ? "Entrar" : "Registrar e entrar"}
            </button>
          </form>
          <div className="mt-5 border-t border-border pt-5">
            {gTicket ? (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitGoogleLink();
                }}
              >
                <p className="text-sm">
                  Conta Google conectada: <strong>{gEmail || "sua conta"}</strong>.
                </p>
                <p className="text-xs text-muted">
                  Falta só ligar a sua key a essa conta. É uma vez só. Depois, é só entrar com o Google, sem digitar a key.
                </p>
                <p className="text-xs font-semibold text-muted">Chave de acesso</p>
                <input
                  type="password"
                  value={gKey}
                  onChange={(event) => setGKey(formatKey(event.target.value))}
                  placeholder="LH-XXXX-XXXX-XXXX-XXXX"
                  className={`${field} font-mono tracking-wider`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {gError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{gError}</p>}
                <button type="submit" disabled={gBusy || gKey.replace(/[^A-Za-z0-9]/g, "").length !== 18} className={`h-11 w-full ${btnPrimary}`}>
                  {gBusy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Ligar minha key
                </button>
                <button type="button" onClick={() => setGTicket("")} className="w-full text-xs font-semibold text-muted hover:underline">
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/api/google/start?d=${encodeURIComponent(deviceId)}`;
                }}
                className="mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface text-sm font-semibold text-fg transition hover:border-primary"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
                  <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
                </svg>
                Entrar com Google
              </button>
            )}
            {!gTicket && (<>
            {!trialOpen ? (
              <button
                type="button"
                onClick={() => setTrialOpen(true)}
                className="w-full text-sm font-semibold text-primary hover:underline"
              >
                Quero testar grátis por 5 minutos
              </button>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitTrial();
                }}
              >
                <p className="text-sm text-muted">
                  Informe seu nome e WhatsApp para liberar um teste de 5 minutos, com 3 buscas.
                </p>
                <input
                  value={trialForm.name}
                  onChange={(event) => setTrialForm({ ...trialForm, name: event.target.value })}
                  placeholder="Seu nome"
                  className={field}
                  autoComplete="name"
                />
                <input
                  value={trialForm.whatsapp}
                  onChange={(event) => setTrialForm({ ...trialForm, whatsapp: event.target.value })}
                  placeholder="WhatsApp com DDD"
                  inputMode="tel"
                  className={field}
                  autoComplete="tel"
                />
                {trialError && (
                  <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{trialError}</p>
                )}
                <button type="submit" disabled={trialBusy} className={`h-11 w-full ${btnPrimary}`}>
                  {trialBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Começar o teste
                </button>
              </form>
            )}
            </>)}
          </div>
          <p className="mt-5 text-center text-xs text-muted">
            Ainda não tem uma chave?{" "}
            <a href="/comprar" className="font-semibold text-primary hover:underline">
              Conheça as opções de acesso
            </a>
          </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="lead-app-shell mx-auto min-h-screen max-w-none bg-[#0b0912] px-4 pb-28 pt-5 text-fg dark:bg-[#0b0912] sm:px-6 sm:pb-16 lg:pl-[292px] lg:pr-8 lg:pt-7">
      <aside className="fixed bottom-4 left-4 top-4 z-40 hidden w-[256px] flex-col rounded-2xl bg-[#171020] p-5 text-white shadow-[0_24px_70px_-26px_rgba(10,20,48,.8)] backdrop-blur-2xl ring-1 ring-inset ring-white/10 lg:flex">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
            <BrandMark className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-violet-200">LEADHUNTER</p>
            <p className="mt-0.5 text-xs text-white/55">Prospecção inteligente</p>
          </div>
        </div>
        <div className="mt-9">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Menu principal</p>
          <nav aria-label="Navegação principal" className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
            {([
              ["inicio", "Dashboard", LayoutDashboard],
              ["buscar", "Buscar leads", Search],
              ["hoje", "Hoje", CalendarClock],
              ["pipeline", "CRM / Pipeline", Columns3],
              ["mensagens", "Mensagens", MessageCircle],
              ["atividades", "Atividades", Clock],
              ["relatorios", "Relatórios", TrendingUp],
              ["oportunidades", "Inteligência", Sparkles],
              ["integracoes", "Integrações", Globe],
              ["configuracoes", "Configurações", ShieldCheck],
              ["vendas", "Vendas", Wallet],
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                  tab === id ? "bg-[#35234d] text-white shadow-lg shadow-black/20" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${tab === id ? "text-primary" : "text-white/65"}`} />
                <span className="flex-1">{label}</span>
                {id === "hoje" && dueCount > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === id ? "bg-danger text-white" : "bg-white/15 text-white"}`}>{dueCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-white/70">Meta de contatos</p>
            <span className="font-mono text-xs font-bold text-blue-200">{Math.min(sendStats.todayCount, dailyGoal)}/{dailyGoal}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-indigo-300 transition-all" style={{ width: `${Math.min(100, Math.round((sendStats.todayCount / Math.max(1, dailyGoal)) * 100))}%` }} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/45">Um contato por vez. Constância traz mais respostas.</p>
        </div>
        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => {
              if (pipeline.length > 0) openSiteEditor(pipeline[0].id);
              else setTab("pipeline");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#a879ff] to-[#7044bd] px-4 py-3 text-sm font-bold text-[#10172b] shadow-lg shadow-sky-950/20 transition hover:brightness-110"
          >
            <Sparkles className="size-4" /> Criador IA
          </button>
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            {profilePhoto ? <img src={profilePhoto} alt="Foto de perfil" className="size-9 rounded-full object-cover ring-1 ring-white/30"/> : <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{(userName || "LH").slice(0, 1).toUpperCase()}</div>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName || "Seu painel"}</p>
              <p className="text-[11px] text-white/45">Conta ativa</p>
            </div>
          </div>
        </div>
      </aside>
      <header className={`sticky top-3 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#15111f] p-3 shadow-sm dark:border-white/10 dark:bg-surface sm:p-4 ${card}`}>
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary-deep text-primary-fg shadow-[0_8px_20px_-8px_rgba(79,70,229,0.45)]">
            <BrandMark className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">LeadHunter</p>
            <h1 className="font-display text-lg font-semibold leading-tight">
              {userName ? `Olá, ${userName.split(" ")[0]}` : "Empresas sem site"}
            </h1>
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Área de trabalho</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
            {TAB_LABELS[tab]}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex max-w-[50vw] items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-2 p-1 sm:flex lg:hidden">
            {(
              [
                ["inicio", "Resumo"],
                ["buscar", "Buscar"],
                ["hoje", "Hoje"],
                ["pipeline", "CRM"],
                ["mensagens", "Mensagens"],
                ["atividades", "Atividades"],
                ["relatorios", "Relatórios"],
                ["oportunidades", "Inteligência"],
                ["integracoes", "Integrações"],
                ["configuracoes", "Configurações"],
                ["vendas", "Vendas"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === id ? "bg-primary text-primary-fg shadow-sm" : "text-muted hover:bg-surface hover:text-fg"
                }`}
              >
                {label}
                {id === "hoje" && dueCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{dueCount}</span>
                )}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMySitesOpen(true)}
            aria-label="Meus sites"
            title="Meus sites"
            className={`${btnGhost} px-2.5`}
          >
            <Globe className="size-4" />
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} aria-label="Ajuda" className={`${btnGhost} px-2.5`}>
            <HelpCircle className="size-4" />
          </button>
          {installEvent && (
            <button type="button" onClick={() => void installApp()} className={`${btnGhost} inline-flex items-center gap-2`}>
              <Smartphone className="size-4" /> Instalar
            </button>
          )}
          <span
            title={sync === "error" ? "Sem conexão: seus dados estão só neste aparelho por enquanto" : sync === "saving" ? "Salvando na nuvem…" : "Salvo na nuvem"}
            className="flex size-9 items-center justify-center text-muted"
          >
            {sync === "saving" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : sync === "error" ? (
              <CloudOff className="size-4 text-danger" />
            ) : (
              <Cloud className="size-4" />
            )}
          </span>
          <button type="button" onClick={toggleTheme} aria-label="Alternar tema" className={`${btnGhost} px-2.5`}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button type="button" onClick={() => void logoutAndSave()} className={`inline-flex items-center gap-2 ${btnGhost}`}>
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </header>

      {announcement && announcement !== annDismissed && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm">
          <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="flex-1">{announcement}</p>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => {
              saveAnnDismissed(announcement);
              setAnnDismissed(announcement);
            }}
            className="text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {expiresMs && isTest && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100">
          <span className="font-semibold">Modo teste</span>
          <span className="font-mono font-bold tabular-nums">
            {String(Math.floor(Math.max(0, expiresMs - now) / 60000)).padStart(2, "0")}:
            {String(Math.floor((Math.max(0, expiresMs - now) % 60000) / 1000)).padStart(2, "0")}
          </span>
        </div>
      )}
      {expiresMs && !isTest && expiresMs - now < 5 * 86400000 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100">
          <span className="font-semibold">
            Seu acesso vence em {Math.max(0, Math.ceil((expiresMs - now) / 86400000))} dia(s).
          </span>
          <a href="/comprar" className="font-semibold underline">
            Renovar
          </a>
        </div>
      )}

      {tab === "inicio" && (
        <section className="fade-up space-y-5">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#21152f]/95 via-[#392354]/90 to-[#7044bd]/90 p-6 text-white shadow-[0_28px_70px_-30px_rgba(45,55,145,.65)] backdrop-blur-2xl ring-1 ring-inset ring-white/15 sm:p-8">
            <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-24 right-1/3 -z-10 size-56 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  <Sparkles className="size-3.5" /> Central de prospecção
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Encontre oportunidades. Feche mais negócios.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">Seus contatos, retornos e sites em um só lugar. Escolha uma ação para continuar de onde parou.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setTab("buscar")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  <Search className="size-4" /> Buscar empresas
                </button>
                {pipeline.length > 0 && (
                  <button type="button" onClick={() => openSiteEditor(pipeline[0].id)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#263b75] shadow-lg transition hover:-translate-y-0.5">
                    <Sparkles className="size-4" /> Criar site com IA
                  </button>
                )}
                <button type="button" onClick={startFocus} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-[#102449] shadow-lg transition hover:-translate-y-0.5">
                  <Zap className="size-4" /> Começar
                </button>
              </div>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 sm:grid-cols-5">
              {[
                ["Empresas encontradas", totalFound],
                ["Ativos", pipeline.filter((row) => row.status !== "fechado" && row.status !== "perdido").length],
                ["Retornos", dueCount],
                ["Contatos hoje", sendStats.todayCount],
                ["Meta diária", dailyGoal],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                  <p className="text-xs font-medium text-blue-100/70">{label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {([
              ["Leads ativos", String(pipeline.filter((row) => row.status !== "fechado" && row.status !== "perdido").length), Users, "pipeline"],
              ["Retornos pendentes", String(dueCount), CalendarClock, "hoje"],
              ["Contatos hoje", `${sendStats.todayCount}/${dailyGoal}`, MessageCircle, "hoje"],
              ["Vendas fechadas", String(closed.length), BadgeCheck, "vendas"],
            ] as const).map(([label, value, Icon, destination]) => (
              <button
                key={label}
                type="button"
                onClick={() => setTab(destination)}
                className={`group p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 sm:p-5 ${card}`}
              >
                <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-fg">
                  <Icon className="size-5" />
                </span>
                <span className="block text-sm text-muted">{label}</span>
                <span className="mt-1 block font-display text-2xl font-bold tabular-nums">{value}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className={`p-4 sm:p-5 ${card}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Target className="size-5 text-primary" /> Prioridades de hoje
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {todayLists.due.length} retorno(s) pendente(s) · {todayLists.stale.length} parado(s) · {todayLists.fresh.length} novo(s)
                  </p>
                </div>
                <button type="button" onClick={() => setTab("hoje")} className="text-sm font-semibold text-primary hover:underline">
                  Abrir fila
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  ...todayLists.due.map((lead) => ({ lead, reason: "Retorno pendente" })),
                  ...todayLists.stale.map((lead) => ({ lead, reason: "Sem resposta recente" })),
                  ...todayLists.fresh.map((lead) => ({ lead, reason: "Novo para contatar" })),
                ].filter((item, index, all) => all.findIndex((candidate) => candidate.lead.id === item.lead.id) === index)
                  .slice(0, 5).map(({ lead, reason }) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => { setPipeQuery(lead.name); setTab("pipeline"); }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface-2 px-3.5 py-3 text-left transition hover:border-primary/40 hover:bg-primary-soft/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{lead.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{reason} · {lead.city || "Cidade não informada"}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">{STATUSES.find((item) => item.id === lead.status)?.label ?? lead.status}</span>
                  </button>
                ))}
                {pipeline.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                    <p className="text-sm font-semibold">Seu pipeline ainda está vazio.</p>
                    <p className="mt-1 text-xs text-muted">Busque empresas e salve as melhores oportunidades para começar.</p>
                    <button type="button" onClick={() => setTab("buscar")} className="mt-3 text-sm font-bold text-primary hover:underline">Buscar meu primeiro lead</button>
                  </div>
                )}
                {pipeline.length > 0 && todayLists.due.length + todayLists.stale.length + todayLists.fresh.length === 0 && (
                  <p className="rounded-2xl bg-primary-soft px-4 py-5 text-center text-sm font-medium text-primary">Tudo em dia por aqui. Você pode buscar novas oportunidades.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 sm:p-5 ${card}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Zap className="size-5 text-primary" /> Meta diária</h3>
                    <p className="mt-1 text-sm text-muted">{sendStats.todayCount} de {dailyGoal} contatos registrados</p>
                  </div>
                  <span className="font-display text-2xl font-bold tabular-nums text-primary">
                    {Math.min(100, Math.round((sendStats.todayCount / Math.max(1, dailyGoal)) * 100))}%
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-primary-soft">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary transition-all" style={{ width: `${Math.min(100, Math.round((sendStats.todayCount / Math.max(1, dailyGoal)) * 100))}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">{sendStats.streak} dia(s) seguidos com atividade</p>
              </div>

              <div className={`p-4 sm:p-5 ${card}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">Atividade recente</h3>
                    <p className="mt-1 text-sm text-muted">Leads adicionados ou contatados por último.</p>
                  </div>
                  <button type="button" onClick={() => setTab("pipeline")} className="text-sm font-semibold text-primary hover:underline">Pipeline</button>
                </div>
                <div className="mt-3 space-y-1">
                  {[...pipeline]
                    .sort((a, b) => (b.lastContact || b.addedAt || "").localeCompare(a.lastContact || a.addedAt || ""))
                    .slice(0, 4)
                    .map((lead) => {
                      const stamp = lead.lastContact || lead.addedAt;
                      return (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => { setPipeQuery(lead.name); setTab("pipeline"); }}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-2"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Building2 className="size-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{lead.name}</span>
                            <span className="block truncate text-xs text-muted">{lead.lastContact ? "Último contato" : "Adicionado ao pipeline"} · {stamp ? new Date(stamp).toLocaleDateString("pt-BR") : "Data não informada"}</span>
                          </span>
                          <span className="shrink-0 text-[10px] font-bold text-muted">{STATUSES.find((item) => item.id === lead.status)?.label ?? lead.status}</span>
                        </button>
                      );
                    })}
                  {pipeline.length === 0 && <p className="rounded-xl bg-surface-2 px-3 py-4 text-center text-sm text-muted">Sua atividade aparecerá aqui quando salvar leads.</p>}
                </div>
              </div>
            </div>
          </div>
                  <div className={`mt-4 p-4 sm:p-5 ${card}`}>
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">Atividades recentes</h3><button type="button" onClick={()=>setTab("atividades")} className="text-sm font-semibold text-primary">Ver histórico</button></div>
            {activityItems.slice(0,5).length ? <div className="divide-y divide-border">{activityItems.slice(0,5).map((item)=><div key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span className="truncate">{item.text} · {item.company}</span><time className="shrink-0 text-xs text-muted">{new Date(item.at).toLocaleDateString("pt-BR")}</time></div>)}</div> : <p className="text-sm text-muted">Suas buscas e atividades aparecerão aqui.</p>}
          </div>
          <div className={`mt-4 p-4 sm:p-5 ${card}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Resumo das oportunidades</h3><p className="mt-1 text-sm text-muted">{opportunities.filter((item)=>item.score>=70).length} leads salvos com prioridade alta · {pipeline.filter((row)=>row.siteKind==="none").length} sem site identificado</p></div><button type="button" onClick={()=>setTab("oportunidades")} className="text-sm font-semibold text-primary">Abrir inteligência</button></div>
            {opportunities.slice(0,3).length>0 && <div className="mt-3 grid gap-2 sm:grid-cols-3">{opportunities.slice(0,3).map(({row,score})=><div key={row.id} className="rounded-xl border border-border/60 bg-surface/55 px-3 py-2"><p className="truncate text-sm font-semibold">{row.name}</p><p className="text-xs text-muted">{row.city} · Prioridade {score}/100</p></div>)}</div>}
          </div>
        </section>
      )}

      {tab === "buscar" && (
        <section className="fade-up space-y-4">
          <div className={`grid gap-3 p-4 sm:grid-cols-2 sm:p-5 ${card}`}>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-semibold">País da prospecção</span>
              <select
                value={countryCode}
                onChange={(event) => {
                  const next = event.target.value;
                  setCountryCode(next);
                  setCity(next === "BR" ? CITIES[0] : "");
                }}
                className={field}
              >
                <option value="BR">🇧🇷 Brasil</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="CA">🇨🇦 Canadá</option>
                <option value="GB">🇬🇧 Reino Unido</option>
                <option value="PT">🇵🇹 Portugal</option>
                <option value="ES">🇪🇸 Espanha</option>
                <option value="FR">🇫🇷 França</option>
                <option value="DE">🇩🇪 Alemanha</option>
                <option value="IT">🇮🇹 Itália</option>
                <option value="AU">🇦🇺 Austrália</option>
                <option value="IE">🇮🇪 Irlanda</option>
                <option value="MX">🇲🇽 México</option>
              </select>
              {countryCode !== "BR" && (
                <p className="mt-1 text-xs text-muted">Digite a cidade no idioma local ou em inglês. Ex.: Miami, Florida / Toronto / Lisboa.</p>
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Cidade</span>
              <select
                value={countryCode === "BR" && CITIES.includes(city) ? city : "__outra__"}
                onChange={(event) => setCity(event.target.value === "__outra__" ? "" : event.target.value)}
                className={field}
              >
                {countryCode === "BR" && CITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="__outra__">Outra cidade…</option>
              </select>
              {(countryCode !== "BR" || !CITIES.includes(city)) && (
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder={countryCode === "BR" ? "Ex.: Divinópolis, MG" : "Ex.: Miami, Florida"}
                  className={`${field} mt-2`}
                  autoFocus
                />
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Quantos leads</span>
              <select
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className={field}
              >
                {QUANTITIES.map((item) => (
                  <option key={item} value={item}>
                    {item} leads
                  </option>
                ))}
              </select>
            </label>
            <div className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-semibold">Nicho (tipo de negócio)</span>
              <select
                value={
                  nicheCustom || (niche !== "" && !ALL_NICHES.includes(niche))
                    ? "__outro__"
                    : niche === ""
                      ? "__qualquer__"
                      : niche
                }
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "__outro__") {
                    setNicheCustom(true);
                    setNiche("");
                  } else if (value === "__qualquer__") {
                    setNicheCustom(false);
                    setNiche("");
                  } else {
                    setNicheCustom(false);
                    setNiche(value);
                  }
                }}
                className={field}
              >
                <option value="__qualquer__">Qualquer tipo de empresa</option>
                {NICHE_GROUPS.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {[...group.niches]
                      .sort((a, b) => a.localeCompare(b, "pt-BR"))
                      .map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                  </optgroup>
                ))}
                <option value="__outro__">Outro tipo (digitar)…</option>
              </select>
              {(nicheCustom || (niche !== "" && !ALL_NICHES.includes(niche))) && (
                <input
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  placeholder="Ex.: loja de tintas, clínica de olhos..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void onSearch();
                  }}
                  className={`${field} mt-2`}
                  autoFocus
                />
              )}
            </div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Nota mínima</span>
              <select
                value={minRating}
                onChange={(event) => setMinRating(Number(event.target.value))}
                className={field}
              >
                <option value={0}>Qualquer</option>
                <option value={3}>3.0+</option>
                <option value={3.5}>3.5+</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className="mb-3 text-sm font-semibold text-primary hover:underline"
              >
                {moreOpen ? "Menos opções" : "Mais opções de busca"}
                {[neighborhood.trim(), minReviews > 0, mobileOnly, onlyOpen, broad].filter(Boolean).length > 0 &&
                  ` (${[neighborhood.trim(), minReviews > 0, mobileOnly, onlyOpen, broad].filter(Boolean).length} ativas)`}
              </button>
              {moreOpen && (
                <div className="mb-4 grid gap-3 rounded-xl bg-surface-2 p-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-semibold">Bairro ou região (opcional)</span>
                    <input
                      value={neighborhood}
                      onChange={(event) => setNeighborhood(event.target.value)}
                      placeholder="Ex.: Centro, Savassi, Zona Sul"
                      className={field}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-semibold">Mínimo de avaliações</span>
                    <select
                      value={minReviews}
                      onChange={(event) => setMinReviews(Number(event.target.value))}
                      className={field}
                    >
                      {[0, 5, 10, 25, 50, 100].map((item) => (
                        <option key={item} value={item}>
                          {item === 0 ? "Qualquer quantidade" : `${item}+ avaliações`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1.5 block font-semibold">Quais empresas buscar</span>
                    <select
                      value={siteMode}
                      onChange={(event) => setSiteMode(event.target.value as typeof siteMode)}
                      className={field}
                    >
                      <option value="sem">Só quem não tem site nenhum</option>
                      <option value="social">Sem site ou só com Instagram/Facebook (recomendado)</option>
                      <option value="todas">Todas, inclusive com site (para achar sites fracos)</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={mobileOnly}
                      onChange={(event) => setMobileOnly(event.target.checked)}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    Só telefone celular (tem WhatsApp)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={onlyOpen}
                      onChange={(event) => setOnlyOpen(event.target.checked)}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    Só empresas abertas agora
                  </label>
                  <label className="flex items-start gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={broad}
                      onChange={(event) => setBroad(event.target.checked)}
                      className="mt-0.5 size-4 accent-[var(--color-primary)]"
                    />
                    <span>
                      <strong>Busca ampla:</strong> pergunta ao Google de mais de um jeito para achar mais empresas. Demora
                      um pouco mais e vale a pena quando a busca normal traz poucos leads.
                    </span>
                  </label>
                </div>
              )}
              <button
                type="button"
                onClick={onSearch}
                disabled={loading}
                className={`h-12 w-full px-4 ${btnPrimary}`}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Buscar no Google
              </button>
              {info && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs font-semibold text-muted">
                    <span>Buscas de hoje</span>
                    <span>
                      {info.usedToday}/{info.dailyLimit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                    <div
                      className={`h-full rounded-full ${info.usedToday >= info.dailyLimit ? "bg-danger" : "bg-gradient-to-r from-sky-400 to-primary"}`}
                      style={{ width: `${Math.min(100, Math.round((info.usedToday / Math.max(1, info.dailyLimit)) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
              {recent.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted">Recentes:</span>
                  {recent.map((item) => (
                    <button
                      key={`${item.city}|${item.niche}`}
                      type="button"
                      onClick={() => {
                        setCity(item.city);
                        setNiche(item.niche);
                      }}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
                    >
                      {item.niche || "todos"} · {item.city.split(",")[0]}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-sm text-muted">
                O Google entrega no máximo 60 lugares por busca. Só entram os que não têm site, e empresas fechadas de vez ficam de fora.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <p>
                {error.includes("places.googleapis.com")
                  ? "A chave está válida, mas a Places API (New) ainda não foi ativada nesse projeto do Google Cloud."
                  : error}
              </p>
            </div>
          )}
          {meta && <p className="text-sm text-muted">{meta}</p>}

          {loading && <SkeletonCards />}

          {!loading && results.length > 0 && (
            <>
              {suggested.id !== "geral" && message !== suggested.text && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-sm">
                  <span>
                    Modelo sugerido para este nicho: <strong>{suggested.label}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage(suggested.text);
                      saveMsg(suggested.text);
                      notify("Mensagem trocada");
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Usar este modelo
                  </button>
                </div>
              )}
              <div className={`space-y-3 p-4 ${card}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold">
                    {shownResults.length} {shownResults.length === 1 ? "lead" : "leads"}
                    <span className="ml-2 text-sm font-medium text-muted">{openCount} abertas agora</span>
                  </h2>
                  <button type="button" onClick={keepAll} className="text-sm font-semibold text-primary hover:underline">
                    Guardar {shownResults.length === results.length ? "todos" : "filtrados"} no pipeline
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setOpenOnly(false)} className={chip(!openOnly)}>
                    Todas
                  </button>
                  <button type="button" onClick={() => setOpenOnly(true)} className={chip(openOnly)}>
                    Abertas agora
                  </button>
                  <button type="button" onClick={() => setHideSaved((value) => !value)} className={chip(hideSaved)}>
                    Esconder guardados
                  </button>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as typeof sort)}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
                    aria-label="Ordenar"
                  >
                    <option value="padrao">Ordem do Google</option>
                    <option value="prioridade">Maior prioridade</option>
                    <option value="abertas">Abertas primeiro</option>
                    <option value="nota">Maior nota</option>
                    <option value="avaliacoes">Mais avaliações</option>
                  </select>
                  <input
                    value={resQuery}
                    onChange={(event) => setResQuery(event.target.value)}
                    placeholder="Filtrar por nome ou bairro"
                    className="min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-sm outline-none placeholder:text-muted/70 focus:border-primary"
                  />
                </div>
              </div>

              {shownResults.length === 0 && (
                <p className={`px-4 py-8 text-center text-muted ${card}`}>
                  Nenhum lead com esse filtro. Tire o filtro de “Abertas agora” ou limpe o texto.
                </p>
              )}
              <div className="grid gap-3">
                {shownResults.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    city={city}
                    message={message}
                    saved={savedKeys.has(lead.id) || savedKeys.has(lead.phone)}
                    onKeep={keep}
                    onAudit={setAuditLead}
                    onPrompt={promptFromLead}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "hoje" && (
        <section className="fade-up space-y-5">
          <div className={`p-4 sm:p-5 ${card}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <Zap className="size-5 text-primary" /> Prospecção do dia
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                  <span>
                    Contatos de hoje: {sendStats.todayCount} de {dailyGoal}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Flame className="size-4 text-orange-500" /> {sendStats.streak} dia(s) seguidos
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-muted">
                  Meta
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={dailyGoal}
                    onChange={(event) => {
                      const value = Math.min(200, Math.max(1, Number(event.target.value) || 1));
                      setDailyGoal(value);
                      saveDailyGoal(value);
                    }}
                    className="w-20 rounded-xl border border-border bg-surface-2 px-2 py-2 text-center text-fg outline-none focus:border-primary"
                  />
                </label>
                <button type="button" onClick={startFocus} className={`px-4 py-2.5 ${btnPrimary}`}>
                  <Zap className="size-4" /> Começar a prospectar
                </button>
                <button type="button" onClick={() => setObjOpen(true)} className={`${btnGhost} inline-flex items-center gap-2`}>
                  <BookOpen className="size-4" /> Respostas rápidas
                </button>
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary-soft">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary transition-all"
                style={{ width: `${Math.min(100, Math.round((sendStats.todayCount / Math.max(1, dailyGoal)) * 100))}%` }}
              />
            </div>
            {sendStats.todayCount >= dailyGoal && <p className="mt-2 text-sm font-semibold text-primary">Meta de hoje batida! 🎉</p>}
          </div>
          <div className={`p-4 sm:p-5 ${card}`}>
            <h2 className="font-display text-xl font-semibold">Seu dia</h2>
            <p className="mt-1 text-sm text-muted">
              {todayLists.due.length} retorno(s) para hoje ou atrasados · {todayLists.stale.length} parado(s) · {todayLists.fresh.length} lead(s) novo(s) para chamar
            </p>
          </div>
          {(
            [
              ["Retornos de hoje e atrasados", todayLists.due],
              ["Parados há 3 dias ou mais", todayLists.stale],
              ["Novos para chamar (até 10)", todayLists.fresh],
            ] as const
          ).map(([title, rows]) => (
            <div key={title} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
                {title} ({rows.length})
              </h3>
              {rows.length === 0 && <p className={`px-4 py-6 text-center text-sm text-muted ${card}`}>Nada aqui. Bom trabalho!</p>}
              <div className="grid gap-3">
                {rows.map((lead) => (
                  <PipelineRow
                    key={lead.id}
                    lead={lead}
                    message={message}
                    followMessage={followMessage}
                    today={today}
                    onStatus={setStatus}
                    onNotes={setOpenId}
                    onRemove={removeLead}
                    onCopy={copyText}
                    onContact={markContact}
                    onSite={openSiteEditor}
                    onAiMessage={draftAiLeadMessage}
                    aiBusyId={aiLeadBusyId}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "pipeline" && (
        <section className="fade-up space-y-4">
          <div className={`flex flex-wrap items-center gap-2 p-3 ${card}`}>
            <input
              value={pipeQuery}
              onChange={(event) => setPipeQuery(event.target.value)}
              placeholder="Buscar no pipeline (nome, telefone, cidade, notas)"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-primary"
            />
            <button
              type="button"
              disabled={!pipeline.length}
              onClick={() => {
                exportCsv(visible);
                notify(`${visible.length} leads exportados`);
              }}
              className={`${btnGhost} inline-flex items-center gap-2 disabled:opacity-50`}
            >
              <Download className="size-4" /> Exportar CSV
            </button>
            <button type="button" onClick={() => setAdding(true)} className={`${btnGhost} inline-flex items-center gap-2`}>
              <Plus className="size-4" /> Adicionar lead
            </button>
            <label className={`${btnGhost} inline-flex cursor-pointer items-center gap-2`}>
              <Upload className="size-4" /> Importar CSV
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void importCsv(file);
                }}
              />
            </label>
            <select
              value={pipeSort}
              onChange={(event) => setPipeSort(event.target.value as typeof pipeSort)}
              aria-label="Ordenar pipeline"
              className="rounded-xl border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="recentes">Mais recentes</option>
              <option value="retorno">Retorno mais próximo</option>
              <option value="valor">Maior valor</option>
              <option value="nome">Nome (A–Z)</option>
            </select>
            <select
              value={tempFilter}
              onChange={(event) => setTempFilter(event.target.value as typeof tempFilter)}
              aria-label="Filtrar por temperatura"
              className="rounded-xl border border-border bg-surface px-2.5 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="todas">Todas as temperaturas</option>
              {TEMPS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex rounded-xl bg-primary-soft p-1">
              <button
                type="button"
                aria-label="Ver em lista"
                onClick={() => setView("lista")}
                className={`rounded-lg p-1.5 ${view === "lista" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Ver em quadro"
                onClick={() => setView("quadro")}
                className={`rounded-lg p-1.5 ${view === "quadro" ? "bg-surface text-primary shadow-sm" : "text-muted"}`}
              >
                <Columns3 className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter("todos")} className={chip(filter === "todos")}>
              Todos ({pipeline.length})
            </button>
            <button type="button" onClick={() => setFilter("retornos")} className={chip(filter === "retornos")}>
              Retornos ({dueCount})
            </button>
            {STATUSES.map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => setFilter(status.id)}
                className={chip(filter === status.id)}
              >
                {status.label} ({pipeline.filter((row) => row.status === status.id).length})
              </button>
            ))}
          </div>
          {view === "lista" && visible.length > 0 && (
            <div className={`flex flex-wrap items-center gap-2 p-3 text-sm ${card}`}>
              <label className="flex items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={visible.length > 0 && visible.every((row) => selected.has(row.id))}
                  onChange={toggleSelectAll}
                  className="size-4 accent-[var(--color-primary)]"
                />
                {selected.size > 0 ? `${selected.size} selecionado(s)` : "Selecionar todos"}
              </label>
              {selected.size > 0 && (
                <>
                  <select
                    value=""
                    onChange={(event) => event.target.value && bulkStatus(event.target.value as Status)}
                    aria-label="Mudar status dos selecionados"
                    className="rounded-xl border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Mudar status…</option>
                    {STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => exportCsv(pipeline.filter((row) => selected.has(row.id)))}
                    className={btnGhost}
                  >
                    Exportar selecionados
                  </button>
                  <button type="button" onClick={bulkRemove} className={`${btnGhost} text-danger`}>
                    Excluir
                  </button>
                  <button type="button" onClick={() => setSelected(new Set())} className={btnGhost}>
                    Limpar
                  </button>
                </>
              )}
            </div>
          )}
          {visible.length === 0 && (
            <p className={`px-4 py-10 text-center text-muted ${card}`}>
              {pipeline.length ? "Nenhum lead com esse filtro." : "Nada aqui ainda. Busque leads e guarde no pipeline."}
            </p>
          )}
          {view === "quadro" && (
            <KanbanBoard
              rows={visible}
              message={message}
              followMessage={followMessage}
              today={today}
              onStatus={setStatus}
              onNotes={setOpenId}
              onContact={markContact}
            />
          )}
          <div className={view === "lista" ? "grid gap-3" : "hidden"}>
            {(view === "lista" ? visible : []).map((lead) => (
              <PipelineRow
                key={lead.id}
                lead={lead}
                message={message}
                followMessage={followMessage}
                today={today}
                onStatus={setStatus}
                onNotes={setOpenId}
                onRemove={removeLead}
                onCopy={copyText}
                onContact={markContact}
                selected={selected.has(lead.id)}
                onSelect={toggleSelect}
                onSite={openSiteEditor}
                onAiMessage={draftAiLeadMessage}
                aiBusyId={aiLeadBusyId}
              />
            ))}
          </div>
        </section>
      )}

      {tab === "vendas" && (
        <section className="fade-up space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                ["Fechados", String(closed.length), BadgeCheck],
                ["No pipeline", String(pipeline.length), Users],
                ["Conversão", `${conversion}%`, TrendingUp],
                ["Receita", money(revenue), Wallet],
                ["Em negociação", money(negotiating), CalendarClock],
              ] as const
            ).map(([label, value, Icon]) => (
              <div key={label} className={`p-4 ${card}`}>
                <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-0.5 font-display text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className={`p-4 sm:p-5 ${card}`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <TrendingUp className="size-4 text-primary" /> Meta do mês
              </h2>
              <label className="text-sm">
                <span className="mr-2 text-muted">Meta (R$)</span>
                <input
                  type="number"
                  min={0}
                  value={goal || ""}
                  placeholder="0"
                  onChange={(event) => {
                    const value = Math.max(0, Number(event.target.value) || 0);
                    setGoal(value);
                    saveGoal(value);
                  }}
                  className="w-32 rounded-xl border border-border bg-surface-2 px-3 py-2 text-right outline-none focus:border-primary"
                />
              </label>
            </div>
            {(() => {
              const current = months[months.length - 1]?.total ?? 0;
              const pct = goal ? Math.min(100, Math.round((current / goal) * 100)) : 0;
              const peak = Math.max(1, ...months.map((item) => item.total));
              return (
                <>
                  {goal > 0 ? (
                    <>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{money(current)} de {money(goal)}</span>
                        <span className="text-muted">{pct}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-primary-soft">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {current >= goal ? "Meta batida! 🎉" : `Faltam ${money(goal - current)} para bater a meta.`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">Defina uma meta para acompanhar o quanto falta.</p>
                  )}
                  <div className="mt-5 flex h-32 items-end gap-2">
                    {months.map((item) => (
                      <div key={item.key} className="flex flex-1 flex-col items-center justify-end gap-1">
                        <span className="text-[10px] text-muted">{item.total ? money(item.total) : ""}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-primary to-sky-300"
                          style={{ height: `${Math.max(4, Math.round((item.total / peak) * 80))}px`, opacity: item.total ? 1 : 0.25 }}
                        />
                        <span className="text-xs capitalize text-muted">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
          <div className={`p-4 sm:p-5 ${card}`}>
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary" /> Funil de vendas
            </h2>
            <div className="space-y-3">
              {STATUSES.map((status) => {
                const count = pipeline.filter((row) => row.status === status.id).length;
                const pct = pipeline.length ? Math.round((count / pipeline.length) * 100) : 0;
                return (
                  <div key={status.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{status.label}</span>
                      <span className="text-muted">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-primary-soft">
                      <div
                        className={`h-full rounded-full ${status.id === "perdido" ? "bg-danger/70" : status.id === "fechado" ? "bg-whatsapp" : "bg-gradient-to-r from-sky-400 to-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`block p-4 text-sm sm:col-span-2 ${card}`}>
              <span className="mb-2 block font-semibold">Ticket padrão (R$)</span>
              <input
                type="number"
                value={ticket}
                onChange={(event) => {
                  const value = Number(event.target.value) || 0;
                  setTicket(value);
                  saveTicket(value);
                }}
                className={field}
              />
            </label>
            <div className={`p-4 text-sm ${card}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold">1ª mensagem (WhatsApp)</span>
                <select
                  aria-label="Modelo da primeira mensagem"
                  value=""
                  onChange={(event) => {
                    const t = outreachTemplates.find((item) => item.id === event.target.value) || FIRST_TEMPLATES.find((item) => item.id === event.target.value);
                    if (!t) return;
                    setMessage(t.text);
                    saveMsg(t.text);
                  }}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs"
                >
                  <option value="">Usar modelo…</option>
                  {outreachTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={message}
                rows={5}
                onChange={(event) => {
                  setMessage(event.target.value);
                  saveMsg(event.target.value);
                }}
                className={field}
              />
              <p className="mt-2 text-muted">Use {"{nome}"} e {"{cidade}"} no texto.</p>
            </div>
            <div className={`p-4 text-sm ${card}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold">Mensagem de retorno</span>
                <select
                  aria-label="Modelo da mensagem de retorno"
                  value=""
                  onChange={(event) => {
                    const t = FOLLOW_TEMPLATES.find((item) => item.id === event.target.value);
                    if (!t) return;
                    setFollowMessage(t.text);
                    saveFollowMsg(t.text);
                  }}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs"
                >
                  <option value="">Usar modelo…</option>
                  {FOLLOW_TEMPLATES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={followMessage}
                rows={5}
                onChange={(event) => {
                  setFollowMessage(event.target.value);
                  saveFollowMsg(event.target.value);
                }}
                className={field}
              />
              <p className="mt-2 text-muted">Enviada no botão “Retorno”, quando o lead já foi contatado.</p>
            </div>
          </div>
          <div className={`p-4 sm:p-5 ${card}`}>
            <h2 className="mb-3 font-semibold">Últimos 7 dias</h2>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {(
                [
                  ["Leads guardados", String(week.added)],
                  ["Contatos feitos", String(week.contacted)],
                  ["Vendas fechadas", String(week.closed)],
                  ["Receita", money(week.revenue)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface-2 p-3">
                  <p className="font-display text-xl font-semibold">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`p-4 sm:p-5 ${card}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Melhores cidades</h2>
              <span className="text-sm text-muted">
                Ticket médio: {money(closed.length ? Math.round(revenue / closed.length) : ticket)}
              </span>
            </div>
            {cityStats.length === 0 ? (
              <p className="text-sm text-muted">Guarde leads no pipeline para ver o ranking por cidade.</p>
            ) : (
              <div className="divide-y divide-border text-sm">
                {cityStats.map((item) => (
                  <div key={item.city} className="flex items-center justify-between py-2">
                    <span className="font-medium">{item.city}</span>
                    <span className="text-muted">
                      {item.leads} leads · {item.closed} fechados · {money(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`p-4 sm:p-5 ${card}`}>
            <h2 className="mb-1 font-semibold">Backup dos seus dados</h2>
            <p className="mb-3 text-sm text-muted">
              Baixe uma cópia dos seus leads e mensagens. Ao restaurar, os leads do arquivo são somados aos que você já tem.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadBackup} className={`${btnGhost} inline-flex items-center gap-2`}>
                <Download className="size-4" /> Baixar backup
              </button>
              <label className={`${btnGhost} inline-flex cursor-pointer items-center gap-2`}>
                <Upload className="size-4" /> Restaurar backup
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void restoreBackup(file);
                  }}
                />
              </label>
            </div>
          </div>
          <div className={`p-4 ${card}`}>
            <h2 className="mb-3 font-semibold">Fechados</h2>
            {closed.length === 0 && <p className="text-sm text-muted">Marque um lead como Fechado no pipeline.</p>}
            <ul className="divide-y divide-border">
              {closed.map((row) => (
                <li key={row.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{row.name}</span>
                  <span className="font-semibold text-accent">{money(row.value || ticket)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

<div>
      {tab === "mensagens" && (
        <section className="fade-up space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Comunicação comercial</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Central de mensagens</h2>
            <p className="mt-1 text-sm text-muted">Modelos, mensagens próprias e atalhos para WhatsApp.</p>
          </div>
          <div className={"grid gap-4 xl:grid-cols-2"}>
            <form className={"space-y-3 p-5 " + card} onSubmit={(event) => {
              event.preventDefault();
              const name = messageName.trim(), text = messageText.trim();
              if (!name || !text) { notify("Preencha o nome e o texto da mensagem."); return; }
              const entry: CustomMessage = { id: editingMessageId || "msg-" + Date.now(), name, text, category: messageCategory };
              const next = editingMessageId ? customMessages.map((item) => item.id === editingMessageId ? entry : item) : [entry, ...customMessages];
              setCustomMessages(next); saveCustomMessages(next);
              setMessageName(""); setMessageText(""); setEditingMessageId("");
              notify(editingMessageId ? "Mensagem atualizada" : "Mensagem salva");
            }}>
              <h3 className="font-semibold">{editingMessageId ? "Editar mensagem" : "Criar mensagem"}</h3>
              <label className="block text-sm">Nome<input value={messageName} onChange={(event) => setMessageName(event.target.value)} maxLength={100} placeholder="Ex.: Apresentação de site" className={field + " mt-1"} /></label>
              <label className="block text-sm">Categoria<select value={messageCategory} onChange={(event) => setMessageCategory(event.target.value)} className={field + " mt-1"}>
                {["Primeiro contato","Apresentação de sites","Proposta","Follow-up","Interessados","Sem resposta","Objeções"].map((item) => <option key={item}>{item}</option>)}
              </select></label>
              <label className="block text-sm">Texto<textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={5} maxLength={2000} placeholder="Use {nome}, {cidade} e {segmento}." className={field + " mt-1"} /></label>
              <p className="text-xs text-muted">Personalização: {"{nome}"}, {"{cidade}"} e {"{segmento}"}.</p>
              <button type="submit" className={btnPrimary}>{editingMessageId ? "Salvar alterações" : "Salvar mensagem"}</button>
              {editingMessageId && <button type="button" onClick={() => { setEditingMessageId(""); setMessageName(""); setMessageText(""); }} className={btnGhost + " ml-2"}>Cancelar</button>}
            </form>
            <div className={"space-y-3 p-5 " + card}>
              <h3 className="font-semibold">Modelos prontos</h3>
              {[...FIRST_TEMPLATES.map((item) => ({...item, category:"Primeiro contato"})), ...FOLLOW_TEMPLATES.map((item) => ({...item, category:"Follow-up"})),
                {id:"site-presentation",label:"Apresentação de site",category:"Apresentação de sites",text:"Oi {nome}! Vi que vocês trabalham com {segmento} em {cidade}. Posso te mostrar uma ideia de site profissional com as informações do negócio e contato direto pelo WhatsApp?"},
                {id:"proposal-follow",label:"Envio de proposta",category:"Proposta",text:"Oi {nome}, conforme conversamos, preparei uma proposta para apresentar os serviços de {segmento} da empresa em {cidade}. Se quiser, posso explicar cada etapa por aqui."},
                {id:"no-response",label:"Sem resposta",category:"Sem resposta",text:"Oi {nome}, tudo bem? Passando para saber se conseguiu ver minha mensagem sobre o site para o negócio de {segmento} em {cidade}. Se não for o momento, sem problema."},
                ...OBJECOES.map((item,index)=>({id:"objection-"+index,label:item.titulo,category:"Objeções",text:item.resposta}))].map((item) => {
                const target = pipeline.find((row) => row.id === messageLeadId);
                const text = target ? fillTemplate(item.text, target.name, target.city, target.category) : item.text;
                return <article key={item.id} className="rounded-2xl border border-border/70 bg-surface/65 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.category}</p>
                  <h4 className="mt-1 font-semibold">{item.label}</h4>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{text}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => void navigator.clipboard?.writeText(text).then(() => notify("Mensagem copiada"))} className={btnGhost}><Copy className="size-4"/>Copiar</button>
                    {target && <a href={waLink(target.phone,target.name,item.text,target.city,target.category)} target="_blank" rel="noreferrer" className={btnGhost}><MessageCircle className="size-4"/>WhatsApp</a>}
                  </div>
                </article>;
              })}
            </div>
          </div>
          <div className={"space-y-3 p-5 " + card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Minhas mensagens</h3>
              <select value={messageLeadId} onChange={(event) => setMessageLeadId(event.target.value)} className={field + " w-auto min-w-48"}>
                <option value="">Sem lead selecionado</option>
                {pipeline.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.city}</option>)}
              </select>
            </div>
            {customMessages.length === 0 ? <p className="text-sm text-muted">As mensagens que você criar aparecerão aqui.</p> : customMessages.map((item) => {
              const target = pipeline.find((row) => row.id === messageLeadId);
              const text = target ? fillTemplate(item.text, target.name, target.city, target.category) : item.text;
              return <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-primary">{item.category}</p><h4 className="font-semibold">{item.name}</h4><p className="mt-1 line-clamp-2 text-sm text-muted">{text}</p></div>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void navigator.clipboard?.writeText(text).then(() => notify("Mensagem copiada"))} className={btnGhost}><Copy className="size-4"/>Copiar</button>
                  {target && <a href={waLink(target.phone,target.name,item.text,target.city)} target="_blank" rel="noreferrer" className={btnGhost}><MessageCircle className="size-4"/>WhatsApp</a>}
                  <button type="button" onClick={() => { setEditingMessageId(item.id); setMessageName(item.name); setMessageText(item.text); setMessageCategory(item.category); window.scrollTo({top:0,behavior:"smooth"}); }} className={btnGhost}>Editar</button>
                  <button type="button" onClick={() => { if(!window.confirm("Excluir esta mensagem?")) return; const next=customMessages.filter((entry)=>entry.id!==item.id); setCustomMessages(next); saveCustomMessages(next); notify("Mensagem excluída"); }} className={btnGhost + " text-danger"}><Trash2 className="size-4"/>Excluir</button>
                </div>
              </article>;
            })}
          </div>
        </section>
      )}

      {tab === "atividades" && (
        <section className="fade-up space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Linha do tempo</p><h2 className="mt-1 font-display text-2xl font-bold">Histórico de atividades</h2><p className="mt-1 text-sm text-muted">Buscas, leads salvos, contatos e mudanças de etapa.</p></div>
          <div className={"grid gap-3 p-4 sm:grid-cols-[1fr_auto] " + card}>
            <input value={activityQuery} onChange={(event)=>setActivityQuery(event.target.value)} placeholder="Filtrar por empresa, cidade ou atividade" className={field}/>
            <select value={activityRange} onChange={(event)=>setActivityRange(event.target.value as typeof activityRange)} className={field}><option value="todos">Todo o período</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option></select>
          </div>
          <div className={"divide-y divide-border p-4 sm:p-5 " + card}>
            {activityItems.length === 0 ? <p className="py-8 text-center text-sm text-muted">Nenhuma atividade encontrada para esse filtro.</p> : activityItems.map((item) => <article key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Clock className="size-4"/></span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{item.text}</p><p className="truncate text-sm text-muted">{item.company}{item.city ? " · " + item.city : ""}</p></div>
              <time className="shrink-0 text-xs text-muted">{new Date(item.at).toLocaleString("pt-BR")}</time>
            </article>)}
          </div>
        </section>
      )}

      {tab === "relatorios" && (
        <section className="fade-up space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Dados da sua conta</p><h2 className="mt-1 font-display text-2xl font-bold">Relatórios</h2><p className="mt-1 text-sm text-muted">Indicadores calculados com suas buscas registradas e leads no pipeline.</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { exportCsv(pipeline); notify(pipeline.length + " leads exportados"); }} className={btnGhost}><Download className="size-4"/>Exportar leads</button>
              <button type="button" onClick={() => exportSearchHistory(searchHistory)} className={btnGhost}><Download className="size-4"/>Exportar buscas</button>
            </div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {[
              ["Empresas encontradas", totalFound],["Leads salvos", pipeline.length],["Sem site", pipeline.filter((row)=>row.siteKind==="none").length],
              ["Contatos realizados", contactsMade],["Propostas geradas", proposalsSent],["Clientes fechados", closed.length],["Conversão", salesWonRate + "%"],
            ].map(([label,value]) => <div key={label} className={"p-4 " + card}><p className="text-sm text-muted">{label}</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</p></div>)}
          </div>
          <div className={`p-5 ${card}`}><h3 className="mb-3 font-semibold">Empresas encontradas · últimos 7 dias</h3><div className="flex h-32 items-end gap-3">{searchDays.map((item)=>{const peak=Math.max(1,...searchDays.map((day)=>day.count));return <div key={item.key} className="flex flex-1 flex-col items-center gap-2"><span className="text-[10px] text-muted">{item.count}</span><div className="w-full rounded-t-xl bg-gradient-to-t from-primary to-sky-300" style={{height:Math.max(5,Math.round(item.count/peak*82))+"px"}}/><span className="text-xs capitalize text-muted">{item.label}</span></div>})}</div></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={"p-5 " + card}><h3 className="mb-4 font-semibold">Leads por cidade</h3>{reportCities.length ? reportCities.map((item)=>{const pct=pipeline.length?Math.round((item.count/pipeline.length)*100):0;return <div key={item.name} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span className="text-muted">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-primary-soft"><div className="h-full rounded-full bg-primary" style={{width:pct + "%"}}/></div></div>}) : <p className="text-sm text-muted">Salve leads para formar este relatório.</p>}</div>
            <div className={"p-5 " + card}><h3 className="mb-4 font-semibold">Leads por segmento</h3>{segmentStats.length ? segmentStats.map((item)=>{const pct=pipeline.length?Math.round((item.count/pipeline.length)*100):0;return <div key={item.name} className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><span className="text-muted">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-primary-soft"><div className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400" style={{width:pct + "%"}}/></div></div>}) : <p className="text-sm text-muted">Salve leads para formar este relatório.</p>}</div>
          </div>
          <div className={"p-5 " + card}><h3 className="mb-3 font-semibold">Vendas fechadas por mês</h3><div className="flex h-36 items-end gap-3">{months.map((item)=>{const peak=Math.max(1,...months.map((x)=>x.total));return <div key={item.key} className="flex flex-1 flex-col items-center gap-2"><span className="text-[10px] text-muted">{item.total?money(item.total):"—"}</span><div className="w-full rounded-t-xl bg-gradient-to-t from-primary to-sky-300" style={{height:Math.max(6,Math.round(item.total/peak*100)) + "px"}}/><span className="text-xs text-muted">{item.label}</span></div>})}</div></div>
        </section>
      )}

      {tab === "oportunidades" && (
        <section className="fade-up space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Prioridade baseada em sinais reais</p><h2 className="mt-1 font-display text-2xl font-bold">Inteligência de leads</h2><p className="mt-1 text-sm text-muted">A nota considera avaliação, volume de avaliações, presença digital e telefone. Organiza a fila; não prevê intenção de compra.</p></div>
          {opportunities.length === 0 ? <div className={"p-8 text-center " + card}><Sparkles className="mx-auto size-8 text-primary"/><p className="mt-3 font-semibold">Ainda não há leads suficientes</p><p className="mt-1 text-sm text-muted">Busque empresas e salve os resultados para ver oportunidades.</p><button type="button" onClick={()=>setTab("buscar")} className={btnPrimary + " mt-4"}>Buscar leads</button></div> :
            <div className="grid gap-3 lg:grid-cols-2">{opportunities.map(({row,score})=>{const high=score>=70,medium=score>=45;return <article key={row.id} className={"p-4 " + card}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{row.name}</h3><p className="text-sm text-muted">{row.category} · {row.city}</p></div><span className={"rounded-full px-3 py-1 text-xs font-bold " + (high?"bg-emerald-100 text-emerald-800":medium?"bg-amber-100 text-amber-800":"bg-surface-2 text-muted")}>{high?"Alta":medium?"Média":"Baixa"} · {score}/100</span></div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary">{row.siteKind==="none"?"Sem site":row.siteKind==="social"?"Só redes sociais":row.siteKind==="site"?"Site identificado":"Presença não verificada"}</span><span className="rounded-full bg-surface-2 px-2.5 py-1 text-muted">Nota {row.rating || "—"} · {row.reviews} avaliações</span><ObservationBadge observedAt={row.observedAt} showMissing/></div>
              <div className="mt-4 flex gap-2"><a href={waLink(row.phone,row.name,message,row.city)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-3 py-2 text-sm font-semibold text-white"><MessageCircle className="size-4"/>WhatsApp</a></div>
            </article>;})}</div>}
        </section>
      )}

      {tab === "integracoes" && (
        <section className="fade-up space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Conexões verificadas</p><h2 className="mt-1 font-display text-2xl font-bold">Integrações</h2><p className="mt-1 text-sm text-muted">O painel mostra o estado real; não marca serviços pendentes como conectados.</p></div>
          {integrationsBusy ? <div className={"p-5 text-sm text-muted " + card}>Verificando o servidor…</div> : integrations ? <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["Google Places API",integrations.googlePlacesConfigured],
              ["Conta Google vinculada",integrations.googleAccountLinked],
              ["Google Sheets",integrations.googleSheetsConnected],
              ["Webhooks",integrations.webhookConfigured],
            ] as const).map(([label,connected])=><div key={label} className={"flex items-center justify-between gap-3 p-4 " + card}><span className="font-semibold">{label}</span><span className={"rounded-full px-3 py-1 text-xs font-bold " + (connected?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800")}>{connected?"Conectado":"Pendente"}</span></div>)}
            <div className={"p-4 " + card}><p className="font-semibold">WhatsApp</p><p className="mt-1 text-sm text-muted">Links wa.me abrem no aplicativo do usuário. Não há envio automático pela API.</p><span className="mt-3 inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">Atalho disponível</span></div>
            <div className={"p-4 " + card}><p className="font-semibold">Exportação de dados</p><p className="mt-1 text-sm text-muted">Baixe leads salvos como CSV.</p><button type="button" onClick={()=>exportCsv(pipeline)} className={btnGhost + " mt-3"}><Download className="size-4"/>Exportar CSV</button></div>
          </div> : <div className={"p-5 " + card}><p className="text-sm text-muted">Atualize para verificar as conexões.</p><button type="button" onClick={()=>setIntegrationRefresh((value)=>value+1)} className={btnGhost + " mt-3"}>Verificar agora</button></div>}
        </section>
      )}

      {tab === "configuracoes" && (
        <section className="fade-up space-y-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Preferências da conta</p><h2 className="mt-1 font-display text-2xl font-bold">Configurações</h2><p className="mt-1 text-sm text-muted">Perfil, mensagens, pesquisas e preferências sincronizam quando a nuvem está disponível.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className={"space-y-4 p-5 " + card}><h3 className="font-semibold">Perfil</h3><div className="flex items-center gap-4">
              {profilePhoto ? <img src={profilePhoto} alt="Foto de perfil" className="size-16 rounded-full object-cover ring-2 ring-primary/30"/> : <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft font-display text-xl font-bold text-primary">{(userName||"LH").slice(0,1).toUpperCase()}</span>}
              <label className={btnGhost + " cursor-pointer"}>{profileBusy?"Preparando…":"Alterar foto"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event)=>{void updateProfilePhoto(event.target.files?.[0]);event.target.value="";}}/></label>
            </div>
            <label className="block text-sm">Nome<input value={profileNameDraft} onChange={(event)=>setProfileNameDraft(event.target.value)} maxLength={100} className={field + " mt-1"}/></label><button type="button" onClick={saveProfile} className={btnPrimary}>Salvar perfil</button>
            <div className="rounded-xl bg-surface-2 p-3 text-sm"><p className="font-semibold">Senha</p><p className="mt-1 text-muted">Este aplicativo usa chave de acesso, não senha. Para renovar, fale com o suporte.</p></div>
            </div>
            <div className={"space-y-4 p-5 " + card}><h3 className="font-semibold">Pesquisa e aparência</h3>
              <label className="block text-sm">Cidade padrão<input value={city} onChange={(event)=>setCity(event.target.value)} placeholder="Cidade, UF" className={field + " mt-1"}/></label>
              <label className="block text-sm">Segmento padrão<select value={niche} onChange={(event)=>setNiche(event.target.value)} className={field + " mt-1"}>{ALL_NICHES.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
              <label className="block text-sm">Nota mínima<select value={minRating} onChange={(event)=>setMinRating(Number(event.target.value))} className={field + " mt-1"}>{[0,3,3.5,4,4.5].map((value)=><option key={value} value={value}>{value} estrelas</option>)}</select></label>
              <label className="block text-sm">Mínimo de avaliações<input type="number" min={0} value={minReviews} onChange={(event)=>setMinReviews(Math.max(0,Number(event.target.value)||0))} className={field + " mt-1"}/></label>
              <label className="block text-sm">Quantidade por busca<select value={quantity} onChange={(event)=>setQuantity(Number(event.target.value))} className={field + " mt-1"}>{QUANTITIES.map((value)=><option key={value} value={value}>{value} empresas</option>)}</select></label>
              <label className="block text-sm">Bairro preferido<input value={neighborhood} onChange={(event)=>setNeighborhood(event.target.value)} placeholder="Opcional" className={field + " mt-1"}/></label>
              <label className="block text-sm">Presença digital<select value={siteMode} onChange={(event)=>setSiteMode(event.target.value as typeof siteMode)} className={field + " mt-1"}><option value="sem">Somente sem site</option><option value="social">Sem site ou só redes sociais</option><option value="todas">Todas as empresas</option></select></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={broad} onChange={(event)=>setBroad(event.target.checked)} className="accent-[var(--color-primary)]"/>Ampliar termos da busca</label>
              <div className="flex flex-wrap gap-2"><button type="button" onClick={toggleTheme} className={btnGhost}>{theme==="dark"?<Sun className="size-4"/>:<Moon className="size-4"/>}{theme==="dark"?"Usar tema claro":"Usar tema escuro"}</button>
                <button type="button" onClick={()=>void toggleNotifications()} className={btnGhost}>{notificationsEnabled?"Desativar lembretes":"Ativar lembretes"}</button></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyOpen} onChange={(event)=>setOnlyOpen(event.target.checked)} className="accent-[var(--color-primary)]"/>Mostrar somente empresas abertas</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mobileOnly} onChange={(event)=>setMobileOnly(event.target.checked)} className="accent-[var(--color-primary)]"/>Priorizar celular</label>
            </div>
          </div>
          <div className={"flex flex-col gap-4 p-5 " + card}><div><h3 className="font-semibold">Privacidade e conta</h3><p className="mt-1 text-sm text-muted">Exporte seus leads antes de sair. O acesso é protegido pela chave vinculada a este aparelho.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>exportCsv(pipeline)} className={btnGhost}><Download className="size-4"/>Exportar dados</button><a href="/privacidade" className={btnGhost}>Política de privacidade</a><a href="/termos" className={btnGhost}>Termos de uso</a><a href="/suporte" className={btnGhost}>Central de ajuda</a><button type="button" onClick={()=>void logoutAndSave()} className={btnGhost + " text-danger"}><LogOut className="size-4"/>Sair da conta</button></div></div>
        </section>
      )}
    </div>

            {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-fg/30 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpenId(null)}>
          <div className={`w-full max-w-md p-5 ${card}`} onClick={(event) => event.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">{open.name}</h3>
            <p className="mt-1 text-sm text-muted">{open.address}</p>
            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block font-semibold">Valor da venda (R$)</span>
              <input
                type="number"
                value={open.value}
                onChange={(event) => {
                  const value = Number(event.target.value) || 0;
                  setPipeline((rows) => rows.map((row) => (row.id === open.id ? { ...row, value } : row)));
                }}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="mb-1.5 block font-semibold">Próximo retorno</span>
              <input
                type="date"
                value={open.followUp || ""}
                onChange={(event) => {
                  const followUp = event.target.value;
                  setPipeline((rows) =>
                    rows.map((row) =>
                      row.id === open.id
                        ? followUp
                          ? addHistory({ ...row, followUp }, `Retorno marcado para ${brDate(followUp)}`)
                          : { ...row, followUp }
                        : row,
                    ),
                  );
                }}
                className={field}
              />
            </label>
            {open.followUp && (
              <a
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
                href={(() => {
                  const start = open.followUp.replaceAll("-", "");
                  const nextDay = new Date(`${open.followUp}T12:00:00`);
                  nextDay.setDate(nextDay.getDate() + 1);
                  const end = nextDay.toLocaleDateString("sv-SE").replaceAll("-", "");
                  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Retorno: ${open.name}`)}&dates=${start}/${end}&details=${encodeURIComponent(`Telefone: ${formatPhone(open.phone)}`)}`;
                })()}
              >
                Adicionar ao Google Agenda
              </a>
            )}
            <div className="mt-3 text-sm">
              <span className="mb-1.5 block font-semibold">Temperatura</span>
              <div className="flex flex-wrap gap-2">
                {TEMPS.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemp(open.id, open.temp === id ? undefined : id)}
                    className={chip(open.temp === id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="mt-3 block text-sm">
              <span className="mb-1.5 block font-semibold">Notas</span>
              <textarea
                rows={4}
                value={open.notes}
                onChange={(event) => {
                  const notes = event.target.value;
                  setPipeline((rows) => rows.map((row) => (row.id === open.id ? { ...row, notes } : row)));
                }}
                className={field}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                if (!openProposal(open, userName)) notify("Libere pop-ups para abrir a proposta");
                else setPipeline((rows) => rows.map((row) => row.id === open.id ? addHistory(row, "Proposta gerada em PDF") : row));
              }}
              className={`${btnGhost} mt-3 w-full py-2.5`}
            >
              Gerar proposta (PDF)
            </button>
            {open.history && open.history.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-sm font-semibold">Histórico</p>
                <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1 text-xs text-muted">
                  {[...open.history].reverse().map((item, index) => (
                    <li key={`${item.at}-${index}`} className="flex gap-2">
                      <span className="shrink-0 font-mono">
                        {new Date(item.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}{" "}
                        {new Date(item.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={() => setOpenId(null)} className={`mt-4 w-full py-3 ${btnPrimary}`}>
              Fechar
            </button>
          </div>
        </div>
      )}
      {aiLeadDraft && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-fg/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="ai-lead-title">
          <section className={`my-auto w-full max-w-xl space-y-4 p-5 sm:p-6 ${card}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Assistente de prospecção</p>
                <h2 id="ai-lead-title" className="mt-1 font-display text-xl font-bold">Mensagem para {aiLeadDraft.lead.name}</h2>
                <p className="mt-1 text-sm text-muted">Revise e ajuste a mensagem antes de abrir o WhatsApp.</p>
              </div>
              <button type="button" onClick={() => setAiLeadDraft(null)} aria-label="Fechar" className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg"><X className="size-5" /></button>
            </div>
            <textarea
              value={aiLeadDraft.text}
              onChange={(event) => setAiLeadDraft((current) => current ? { ...current, text: event.target.value } : current)}
              rows={6}
              className={field}
              autoFocus
            />
            {aiLeadError && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{aiLeadError}</p>}
            <p className="text-xs text-muted">A IA usa os dados do lead e evita afirmar fatos não confirmados. O limite diário do seu plano é aplicado.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => copyText(aiLeadDraft.text, "Mensagem copiada")} className={btnGhost}><Copy className="size-4" /> Copiar</button>
              <a
                href={waLink(aiLeadDraft.lead.phone, aiLeadDraft.lead.name, aiLeadDraft.text, aiLeadDraft.lead.city)}
                target="_blank"
                rel="noreferrer"
                onClick={() => { markContact(aiLeadDraft.lead.id); setAiLeadDraft(null); }}
                className={`${btnPrimary} inline-flex items-center`}
              >
                <MessageCircle className="size-4" /> Revisar no WhatsApp
              </a>
            </div>
          </section>
        </div>
      )}
      {aiLeadBusyId && <span className="sr-only" aria-live="polite">Gerando mensagem personalizada</span>}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {(
          [
            ["inicio", "Resumo", LayoutDashboard],
            ["buscar", "Buscar", Search],
            ["hoje", "Hoje", CalendarClock],
            ["pipeline", "Pipeline", Users],
            ["vendas", "Vendas", Wallet],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              tab === id ? "text-primary" : "text-muted"
            }`}
          >
            <Icon className="size-5" />
            {label}
            {id === "hoje" && dueCount > 0 && (
              <span className="absolute right-1/4 top-1.5 rounded-full bg-danger px-1.5 text-[9px] font-bold text-white">{dueCount}</span>
            )}
          </button>
        ))}
      </nav>
      {siteLeadId &&
        (() => {
          const siteLead = pipeline.find((row) => row.id === siteLeadId) ?? siteExtra ?? undefined;
          if (!siteLead) return null;
          return (
            <SiteStudio
              key={`${siteLead.id}-${sitePane}`}
              initialPane={sitePane}
              lead={siteLead}
              accessKey={accessKey}
              deviceId={deviceId}
              sellerName={userName}
              isTest={isTest}
              onClose={() => {
                setSiteLeadId(null);
                setSiteExtra(null);
              }}
              onUsage={(used, limit) => setInfo((prev) => (prev ? { ...prev, usedToday: used, dailyLimit: limit } : prev))}
              onAccessError={(code) => logout(accessMessage(code))}
              notify={notify}
              onSent={(id, text) =>
                setPipeline((rows) => rows.map((row) => (row.id === id ? addHistory(sendRow(row), text) : row)))
              }
              onProposal={(target) => {
                if (!openProposal(target, userName)) notify("Libere pop-ups para abrir a proposta");
                else setPipeline((rows) => rows.map((row) => row.id === target.id ? addHistory(row, "Proposta gerada em PDF") : row));
              }}
              onWon={(id) => {
                setStatus(id, "fechado");
                notify("Venda fechada!");
              }}
            />
          );
        })()}
      {auditLead && auditLead.website && (
        <SiteAuditModal
          name={auditLead.name}
          phone={auditLead.phone}
          url={auditLead.website}
          accessKey={accessKey}
          deviceId={deviceId}
          sellerName={userName}
          onClose={() => setAuditLead(null)}
          onAccessError={(code) => logout(accessMessage(code))}
          notify={notify}
        />
      )}
      {mySitesOpen && (
        <MySitesModal
          accessKey={accessKey}
          deviceId={deviceId}
          onClose={() => setMySitesOpen(false)}
          onAccessError={(code) => logout(accessMessage(code))}
          notify={notify}
        />
      )}
      {focusOpen &&
        (() => {
          const total = focusQueue.length;
          const done = focusIndex >= total;
          const lead = done ? undefined : pipeline.find((row) => row.id === focusQueue[focusIndex]);
          const step = lead ? stepOf(lead) : 0;
          const text = lead ? fillTemplate(messageForStep(step, message, followMessage), lead.name, lead.city) : "";
          const why = lead
            ? lead.followUp && lead.followUp < today
              ? "Retorno atrasado"
              : lead.followUp && lead.followUp === today
                ? "Retorno de hoje"
                : lead.status !== "novo" && lead.lastContact && daysSince(lead.lastContact) >= 3
                  ? `Parado há ${daysSince(lead.lastContact)} dias`
                  : "Lead novo"
            : "";
          return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-bg p-4">
              <div className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Zap className="size-5 text-primary" /> Modo foco
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setObjOpen(true)} className={`${btnGhost} inline-flex items-center gap-2`}>
                      <BookOpen className="size-4" /> Respostas
                    </button>
                    <button type="button" aria-label="Sair do modo foco" onClick={() => setFocusOpen(false)} className="p-2 text-muted hover:text-fg">
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-muted">
                    <span>
                      Lead {Math.min(focusIndex + 1, total)} de {total}
                    </span>
                    <span>
                      Hoje: {sendStats.todayCount}/{dailyGoal} · 🔥 {sendStats.streak}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-primary transition-all"
                      style={{ width: `${Math.round((Math.min(focusIndex, total) / Math.max(1, total)) * 100)}%` }}
                    />
                  </div>
                </div>

                {done ? (
                  <div className={`p-6 text-center ${card}`}>
                    <CheckCircle2 className="mx-auto size-12 text-primary" />
                    <h2 className="mt-3 font-display text-xl font-semibold">Fila concluída!</h2>
                    <p className="mt-1 text-sm text-muted">
                      Você enviou {sendStats.todayCount} mensagem(ns) hoje. Os retornos já ficaram marcados na aba Hoje.
                    </p>
                    <button type="button" onClick={() => setFocusOpen(false)} className={`mt-5 w-full py-3 ${btnPrimary}`}>
                      Fechar
                    </button>
                  </div>
                ) : !lead ? (
                  <div className={`p-6 text-center ${card}`}>
                    <p className="text-sm text-muted">Esse lead não está mais no pipeline.</p>
                    <button type="button" onClick={focusNext} className={`mt-4 w-full py-3 ${btnPrimary}`}>
                      Próximo
                    </button>
                  </div>
                ) : (
                  <div className={`space-y-4 p-4 sm:p-5 ${card}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-deep dark:text-primary">
                        {why}
                      </span>
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-muted">
                        Mensagem {Math.min(step + 1, 4)} da cadência
                      </span>
                      {lead.temp && (
                        <span className="text-xs font-bold">{TEMPS.find((item) => item[0] === lead.temp)?.[1]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-semibold">{lead.name}</h3>
                      <p className="mt-1 text-sm text-muted">
                        {formatPhone(lead.phone)} · {lead.city.split(",")[0]}
                        {lead.rating > 0 ? ` · ★ ${lead.rating}` : ""}
                      </p>
                      {lead.notes && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">{lead.notes}</p>}
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Mensagem</p>
                      <p className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm">{text}</p>
                      <button
                        type="button"
                        onClick={() => copyText(text, "Mensagem copiada")}
                        className="mt-2 text-sm font-semibold text-primary hover:underline"
                      >
                        Copiar mensagem
                      </button>
                    </div>
                    <a
                      href={waLink(lead.phone, lead.name, messageForStep(step, message, followMessage), lead.city)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-14 items-center justify-center gap-2 rounded-xl bg-whatsapp text-lg font-bold text-primary-fg shadow-sm transition hover:brightness-105"
                    >
                      <MessageCircle className="size-5" /> Abrir WhatsApp
                    </a>
                    {step >= 3 && (
                      <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
                        Essa já é a última mensagem da cadência. Se não houver resposta, considere marcar como sem interesse.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => focusSent(lead.id)} className={`col-span-2 py-3 ${btnPrimary}`}>
                        <CheckCircle2 className="size-4" /> Enviei, próximo
                      </button>
                      <button type="button" onClick={() => focusReplied(lead.id)} className={`${btnGhost} justify-center py-2.5`}>
                        Respondeu
                      </button>
                      <button type="button" onClick={() => focusLost(lead.id)} className={`${btnGhost} justify-center py-2.5 text-danger`}>
                        Sem interesse
                      </button>
                      <button type="button" onClick={focusNext} className={`${btnGhost} col-span-2 justify-center py-2.5`}>
                        <SkipForward className="size-4" /> Pular
                      </button>
                    </div>
                    <p className="text-xs text-muted">
                      “Enviei” marca o contato, passa o lead para Contatado e agenda o próximo retorno (em {GAPS.join(", ")} dias, nas 3 primeiras mensagens).
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      {objOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-fg/40 p-4 backdrop-blur-sm sm:items-center">
          <div className={`max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 ${card}`}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Respostas rápidas</h2>
              <button type="button" aria-label="Fechar" onClick={() => setObjOpen(false)} className="text-muted hover:text-fg">
                <X className="size-5" />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted">Toque em copiar e cole no WhatsApp. Adapte ao seu jeito e só prometa o que você consegue cumprir.</p>
            <div className="space-y-3">
              {OBJECOES.map((item) => (
                <div key={item.titulo} className="rounded-xl bg-surface-2 p-3">
                  <p className="text-sm font-semibold">{item.titulo}</p>
                  <p className="mt-1 text-sm text-muted">{item.resposta}</p>
                  <button
                    type="button"
                    onClick={() => copyText(item.resposta, "Resposta copiada")}
                    className="mt-2 text-sm font-semibold text-primary hover:underline"
                  >
                    Copiar resposta
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-4 backdrop-blur-sm sm:items-center">
          <div className={`max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 ${card}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Ajuda</h2>
              <button type="button" aria-label="Fechar" onClick={() => setHelpOpen(false)} className="text-muted hover:text-fg">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              {(
                [
                  ["Como busco empresas?", "Na aba Buscar, escolha a cidade e o tipo de negócio e clique em buscar. Só aparecem empresas sem site cadastrado no Google."],
                  ["Quando os dados foram consultados?", "Cada cartão mostra quando o Google Places retornou os dados. Isso não confirma se o site ainda está ativo; confira o site ou o Maps antes de abordar leads antigos."],
                  ["O que é a prioridade?", "É uma nota de 0 a 100 que soma nota do Google, número de avaliações, se está aberta agora e se o telefone é celular. Serve para decidir quem chamar primeiro."],
                  ["Por que a busca acabou?", "Cada key tem um limite de buscas por dia. A barra \"Buscas de hoje\" mostra quanto falta, e o limite volta no dia seguinte."],
                  ["Meus dados ficam salvos?", "Sim, na nuvem, ligados à sua key. Você também pode baixar um backup na aba Vendas."],
                  ["Posso usar em mais de um aparelho?", "Sim, até o limite da sua key, em geral 2 aparelhos."],
                ] as const
              ).map(([question, answer]) => (
                <div key={question}>
                  <p className="font-semibold">{question}</p>
                  <p className="mt-0.5 text-muted">{answer}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  setTourStep(0);
                  setTourOpen(true);
                }}
                className={btnGhost}
              >
                Rever o tutorial
              </button>
              {SUPPORT_WHATSAPP && (
                <a
                  className={`${btnGhost} inline-flex items-center gap-2`}
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                >
                  <MessageCircle className="size-4" /> Falar com o suporte
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {adding && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-fg/30 p-4 backdrop-blur-sm sm:items-center">
          <form
            className={`w-full max-w-md space-y-3 p-5 ${card}`}
            onSubmit={(event) => {
              event.preventDefault();
              addManual();
            }}
          >
            <h2 className="font-display text-xl font-semibold">Adicionar lead</h2>
            <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Nome da empresa" className={field} />
            <input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="Telefone com DDD" inputMode="tel" className={field} />
            <input value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} placeholder={`Cidade (padrão: ${city.split(",")[0]})`} className={field} />
            <textarea value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} rows={3} placeholder="Notas (opcional)" className={field} />
            {addError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{addError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAdding(false); setAddError(""); }} className={`${btnGhost} flex-1 py-3`}>
                Cancelar
              </button>
              <button type="submit" className={`flex-1 py-3 ${btnPrimary}`}>
                Adicionar
              </button>
            </div>
          </form>
        </div>
      )}
      {tourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 text-center ${card}`}>
            {(
              [
                ["Busque empresas sem site", "Na aba Buscar, escolha a cidade e o tipo de negócio. O painel mostra só quem não tem site, com telefone e se está aberta agora."],
                ["Guarde e chame no WhatsApp", "Guarde os melhores leads no pipeline. O botão do WhatsApp já abre a conversa com a mensagem pronta, e você pode editar o texto na aba Vendas."],
                ["Acompanhe o seu dia", "A aba Hoje mostra os retornos e quem está parado. Na aba Vendas você vê a meta do mês e quanto já faturou."],
              ] as const
            ).map(([title, text], index) =>
              index === tourStep ? (
                <div key={title}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Passo {index + 1} de 3</p>
                  <h2 className="mt-2 font-display text-xl font-semibold">{title}</h2>
                  <p className="mt-2 text-sm text-muted">{text}</p>
                </div>
              ) : null,
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  saveTourDone();
                  setTourOpen(false);
                }}
                className={`${btnGhost} flex-1 py-3`}
              >
                Pular
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tourStep < 2) setTourStep(tourStep + 1);
                  else {
                    saveTourDone();
                    setTourOpen(false);
                  }
                }}
                className={`flex-1 py-3 ${btnPrimary}`}
              >
                {tourStep < 2 ? "Próximo" : "Começar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div
          role="status"
          className="fade-up fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg shadow-lg"
        >
          {toast}
          {toastAction && (
            <button
              type="button"
              onClick={() => {
                toastAction.run();
                setToast("");
                setToastAction(null);
              }}
              className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-fg"
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
