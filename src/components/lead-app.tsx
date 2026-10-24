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
  Flame,
  KeyRound,
  List,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  PhoneCall,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
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
} from "lucide-react";
import { checkAccessKey, searchPlaces, type KeyCheck, type Lead } from "@/lib/leads.functions";
import { loadCloud, saveCloud, type CloudData } from "@/lib/cloud.functions";
import {
  FIRST_TEMPLATES,
  FOLLOW_TEMPLATES,
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
  loadFollowMsg,
  loadGoal,
  loadTourDone,
  loadMsg,
  loadPrefs,
  loadPipeline,
  loadTheme,
  loadTicket,
  loadUserName,
  saveAccessKey,
  saveFollowMsg,
  saveGoal,
  saveTourDone,
  saveMsg,
  savePrefs,
  savePipeline,
  saveTheme,
  saveTicket,
  saveUserName,
  type SavedLead,
  type Theme,
  type Status,
} from "@/lib/storage";

const CITIES = [
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
];

const QUANTITIES = [5, 10, 15, 20, 30, 40, 50, 60];

type Tab = "buscar" | "hoje" | "pipeline" | "vendas";

const STATUSES: { id: Status; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "contatado", label: "Contatado" },
  { id: "proposta", label: "Proposta" },
  { id: "fechado", label: "Fechado" },
  { id: "perdido", label: "Perdido" },
];

function formatPhone(phone: string) {
  if (phone.length === 11) return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  if (phone.length === 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  return phone;
}

function fillTemplate(template: string, name: string, city = "") {
  return template.replaceAll("{nome}", name).replaceAll("{cidade}", city.split(",")[0]);
}

function waLink(phone: string, name: string, template: string, city = "") {
  return `https://wa.me/55${phone}?text=${encodeURIComponent(fillTemplate(template, name, city))}`;
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

const card = "rounded-2xl border border-border bg-surface shadow-card";
const field =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-fg outline-none placeholder:text-muted/70 focus:border-primary";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary-deep font-semibold text-primary-fg shadow-[0_6px_16px_-6px_rgba(29,111,224,0.6)] transition hover:brightness-105 disabled:opacity-60";
const btnGhost =
  "rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary";

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
  const rating = (Math.min(lead.rating, 5) / 5) * 40;
  const reviews = Math.min(Math.log10(lead.reviews + 1) / Math.log10(500), 1) * 30;
  const open = lead.openNow === true ? 20 : lead.openNow === null ? 8 : 0;
  const mobile = lead.phone.length === 11 && lead.phone[2] === "9" ? 10 : 3;
  return Math.round(rating + reviews + open + mobile);
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
      title={`Prioridade ${score}/100: soma nota, número de avaliações, se está aberta agora e se o telefone é celular.`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        high
          ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200"
          : mid
            ? "bg-primary-soft text-primary-deep dark:text-primary"
            : "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
      }`}
    >
      <Flame className="size-3.5" />
      {high ? "Prioridade alta" : mid ? "Prioridade média" : "Prioridade baixa"} · {score}
    </span>
  );
}

function chip(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "border-primary bg-primary text-primary-fg shadow-sm"
      : "border-border bg-surface text-muted hover:border-primary/50 hover:text-fg"
  }`;
}

function exportCsv(rows: SavedLead[]) {
  const head = ["Nome", "Telefone", "Cidade", "Status", "Valor", "Retorno", "Notas", "Endereço", "Maps"];
  const esc = (value: string | number) => `"${String(value ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;
  const lines = rows.map((r) =>
    [r.name, formatPhone(r.phone), r.city, r.status, r.value, r.followUp || "", r.notes, r.address, r.mapsUrl || ""]
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
}: {
  lead: Lead;
  city: string;
  message: string;
  saved: boolean;
  onKeep: (lead: Lead) => void;
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
            <span className="inline-block rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-danger">
              Sem site
            </span>
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
      <div className="mt-3 flex gap-4 text-sm">
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
}) {
  const follow = followState(lead.followUp, today);
  const active = lead.status !== "fechado" && lead.status !== "perdido";
  const idle = active && lead.status !== "novo" && lead.lastContact ? daysSince(lead.lastContact) : 0;
  const stale = idle >= 3;
  return (
    <article className={`lead-card fade-up p-4 ${card}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{lead.name}</h3>
          <p className="text-sm text-muted">
            {formatPhone(lead.phone)} · {lead.city}
          </p>
          {(follow && active) || stale || lead.notes ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
  const [tab, setTab] = useState<Tab>("buscar");
  const [ready, setReady] = useState(false);
  const [city, setCity] = useState(CITIES[0]);
  const [niche, setNiche] = useState("restaurante");
  const [quantity, setQuantity] = useState(10);
  const [minRating, setMinRating] = useState(4);
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
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [userName, setUserName] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setPipeline(loadPipeline());
    setTicket(loadTicket());
    setMessage(loadMsg());
    setUserName(loadUserName());
    const prefs = loadPrefs();
    if (prefs) {
      setCity(prefs.city || CITIES[0]);
      setNiche(prefs.niche ?? "restaurante");
      setQuantity(prefs.quantity || 10);
      setMinRating(prefs.minRating ?? 4);
    }
    setFollowMessage(loadFollowMsg());
    setGoal(loadGoal());
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    const device = getDeviceId();
    setDeviceId(device);
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
    if (ready) savePrefs({ city, niche, quantity, minRating });
  }, [city, niche, quantity, minRating, ready]);

  const expiresMs = info?.expiresAt ? new Date(info.expiresAt).getTime() : null;
  const isTest = info?.kind === "test";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
          payload: { pipeline, ticket, message, followMessage, goal },
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
      } else {
        setSync("error");
      }
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline, ticket, message, followMessage, goal, cloudReady, step]);

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
      if (!q) return true;
      return `${row.name} ${row.phone} ${row.city} ${row.notes}`.toLowerCase().includes(q);
    });
    if (pipeSort === "retorno") list.sort((a, b) => (a.followUp || "9999").localeCompare(b.followUp || "9999"));
    if (pipeSort === "valor") list.sort((a, b) => (b.value || 0) - (a.value || 0));
    if (pipeSort === "nome") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [pipeline, filter, deferredPipeQuery, today, pipeSort]);

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
    let rows = results.filter((lead) => {
      if (openOnly && lead.openNow !== true) return false;
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
  }, [results, openOnly, deferredResQuery, sort]);

  const suggested = useMemo(() => suggestTemplate(niche), [niche]);
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
  const negotiating = pipeline
    .filter((row) => row.status === "proposta")
    .reduce((sum, row) => sum + (row.value || ticket), 0);
  const revenue = closed.reduce((sum, row) => sum + (row.value || ticket), 0);
  const conversion = pipeline.length ? Math.round((closed.length / pipeline.length) * 100) : 0;

  async function onSearch() {
    if (loading) return;
    setError("");
    setMeta("");
    setResQuery("");
    setLoading(true);
    try {
      const result = await searchPlaces({
        data: { city, niche, minRating, quantity, accessKey, deviceId },
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
      setInfo((prev) => (prev ? { ...prev, usedToday: result.usage.used, dailyLimit: result.usage.limit } : prev));
      setMeta(
        result.leads.length < result.asked
          ? `Pediu ${result.asked} e o Google só tinha ${result.leads.length} sem site com telefone nesta busca (${result.scanned} lidos, ${result.withSite} já tinham site). Tente outro nicho ou baixe a nota.`
          : `${result.leads.length} leads sem site. ${result.withSite} com site foram ignorados.`,
      );
      if (!result.leads.length) {
        setError("Nenhuma empresa sem site com telefone nessa busca. Tente outro nicho ou baixe a nota mínima.");
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

  const keep = useCallback(
    (lead: Lead) => {
      setPipeline((rows) => {
        if (rows.some((row) => row.id === lead.id || (row.phone && row.phone === lead.phone))) return rows;
        return [
          { ...lead, city, status: "novo", notes: "", value: ticket, addedAt: new Date().toISOString() },
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
      })),
      ...rows,
    ]);
    notify(`${fresh.length} guardados no pipeline`);
  }

  const setStatus = useCallback((id: string, status: Status) => {
    setPipeline((rows) =>
      rows.map((row) => {
        if (row.id !== id || row.status === status) return row;
        const stamp = new Date().toISOString();
        return {
          ...row,
          status,
          lastContact: status === "contatado" || status === "proposta" ? stamp : row.lastContact,
          closedAt: status === "fechado" ? stamp : undefined,
        };
      }),
    );
  }, []);

  const markContact = useCallback((id: string) => {
    const stamp = new Date().toISOString();
    setPipeline((rows) => rows.map((row) => (row.id === id ? { ...row, lastContact: stamp } : row)));
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

  async function submitKey() {
    const key = keyInput.trim();
    if (mode === "register" && nameInput.trim().length < 2) {
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
      if (mode === "register") {
        saveUserName(nameInput);
        setUserName(nameInput.trim());
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
          payload: { pipeline, ticket, message, followMessage, goal },
        },
      }).catch(() => null);
    }
    logout();
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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-10 size-80 rounded-full bg-sky-300/30 blur-3xl" aria-hidden />
        <div className={`relative w-full max-w-md p-6 sm:p-8 ${card}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary-deep text-primary-fg shadow-[0_8px_20px_-8px_rgba(29,111,224,0.7)]">
              <Target className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">LeadHunter</p>
              <h1 className="font-display text-2xl font-semibold leading-tight">Acesso ao painel</h1>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-primary-soft p-1">
            {(
              [
                ["login", "Login", LogIn],
                ["register", "Registrar", UserPlus],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setAuthError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  mode === id ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <p className="mb-5 text-sm text-muted">
            {mode === "login"
              ? "Digite a key que você recebeu na compra para entrar."
              : "Primeiro acesso: informe seu nome e a key que você recebeu na compra."}
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
              <span className="mb-1.5 block font-semibold">Sua key</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  value={keyInput}
                  onChange={(event) => setKeyInput(formatKey(event.target.value))}
                  placeholder="LH-XXXX-XXXX-XXXX-XXXX"
                  className={`${field} pl-10 font-mono tracking-wider`}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </label>
            {authError && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{authError}</p>
            )}
            <button type="submit" disabled={checking} className={`h-12 w-full ${btnPrimary}`}>
              {checking ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {mode === "login" ? "Entrar" : "Registrar e entrar"}
            </button>
          </form>
          <p className="mt-5 text-center text-xs text-muted">
            Sem key não há acesso.{" "}
            <a href="/comprar" className="font-semibold text-primary hover:underline">
              Comprar acesso
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      <header className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 ${card}`}>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary-deep text-primary-fg shadow-[0_8px_20px_-8px_rgba(29,111,224,0.7)]">
            <Target className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">LeadHunter</p>
            <h1 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
              {userName ? `Olá, ${userName.split(" ")[0]}` : "Empresas sem site"}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex rounded-xl bg-primary-soft p-1">
            {(
              [
                ["buscar", "Buscar"],
                ["hoje", "Hoje"],
                ["pipeline", "Pipeline"],
                ["vendas", "Vendas"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === id ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-fg"
                }`}
              >
                {label}
                {id === "hoje" && dueCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{dueCount}</span>
                )}
              </button>
            ))}
          </nav>
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

      {tab === "buscar" && (
        <section className="fade-up space-y-4">
          <div className={`grid gap-3 p-4 sm:grid-cols-2 sm:p-5 ${card}`}>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Cidade</span>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={field}
              >
                {CITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
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
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Nicho</span>
              <input
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                placeholder="restaurante, barbearia, clínica..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") void onSearch();
                }}
                className={field}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold">Nota mínima</span>
              <select
                value={minRating}
                onChange={(event) => setMinRating(Number(event.target.value))}
                className={field}
              >
                <option value={0}>Qualquer</option>
                <option value={3.5}>3.5+</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </label>
            <div className="sm:col-span-2">
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
                    const t = FIRST_TEMPLATES.find((item) => item.id === event.target.value);
                    if (!t) return;
                    setMessage(t.text);
                    saveMsg(t.text);
                  }}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs"
                >
                  <option value="">Usar modelo…</option>
                  {FIRST_TEMPLATES.map((item) => (
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
                  setPipeline((rows) => rows.map((row) => (row.id === open.id ? { ...row, followUp } : row)));
                }}
                className={field}
              />
            </label>
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
            <button type="button" onClick={() => setOpenId(null)} className={`mt-4 w-full py-3 ${btnPrimary}`}>
              Fechar
            </button>
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
          className="fade-up fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg shadow-lg"
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
