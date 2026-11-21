import { DEFAULT_FOLLOW_MSG, DEFAULT_MSG } from "./templates";

export { DEFAULT_FOLLOW_MSG, DEFAULT_MSG };

export type Status = "novo" | "contatado" | "aguardando" | "interessado" | "proposta" | "fechado" | "perdido";

export type SavedLead = {
  id: string;
  name: string;
  category: string;
  phone: string;
  rating: number;
  reviews: number;
  address: string;
  mapsUrl: string | null;
  city: string;
  status: Status;
  notes: string;
  value: number;
  addedAt: string;
  /** data do próximo retorno (AAAA-MM-DD) */
  followUp?: string;
  /** último contato feito (ISO) */
  lastContact?: string;
  /** quando virou venda fechada (ISO) */
  closedAt?: string;
  /** linha do tempo do lead */
  history?: { at: string; text: string }[];
  /** temperatura do lead */
  temp?: "quente" | "morno" | "frio";
  /** quantas mensagens da cadência já foram enviadas */
  step?: number;
  website?: string | null;
  siteKind?: "none" | "social" | "site";
  /** quando os dados foram retornados pelo Google Places */
  observedAt?: string;
};

const ACCESS = "lh_access_key";
const USER = "lh_user_name";
const TOKEN = "lh_access_token";

export function loadAccessKey() {
  try {
    return localStorage.getItem(ACCESS) || "";
  } catch {
    return "";
  }
}
export function saveAccessKey(value: string) {
  localStorage.setItem(ACCESS, value);
}
export function clearAccessKey() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(TOKEN);
}
export function loadAccessToken() {
  try {
    return localStorage.getItem(TOKEN) || "";
  } catch {
    return "";
  }
}
export function saveAccessToken(value: string) {
  localStorage.setItem(TOKEN, value);
}
export function loadUserName() {
  try {
    return localStorage.getItem(USER) || "";
  } catch {
    return "";
  }
}
export function saveUserName(value: string) {
  localStorage.setItem(USER, value.trim());
}

const TICKET = "lh_ticket";
const MSG = "lh_msg";
const PIPE = "lh_pipeline";
const FOLLOW = "lh_follow_msg";

export function loadTicket() {
  return Number(localStorage.getItem(TICKET) || "1500") || 1500;
}
export function saveTicket(value: number) {
  localStorage.setItem(TICKET, String(value));
}
export function loadMsg() {
  return localStorage.getItem(MSG) || DEFAULT_MSG;
}
export function loadFollowMsg() {
  return localStorage.getItem(FOLLOW) || DEFAULT_FOLLOW_MSG;
}
export function saveFollowMsg(value: string) {
  localStorage.setItem(FOLLOW, value);
}
export function saveMsg(value: string) {
  localStorage.setItem(MSG, value);
}
export function loadPipeline(): SavedLead[] {
  try {
    return JSON.parse(localStorage.getItem(PIPE) || "[]") as SavedLead[];
  } catch {
    return [];
  }
}
export function savePipeline(rows: SavedLead[]) {
  localStorage.setItem(PIPE, JSON.stringify(rows));
}

const PREFS = "lh_search_prefs";

export type SearchPrefs = {
  city: string;
  niche: string;
  quantity: number;
  minRating: number;
  neighborhood?: string;
  minReviews?: number;
  mobileOnly?: boolean;
  onlyOpen?: boolean;
  broad?: boolean;
  siteMode?: "sem" | "social" | "todas";
};

export function loadPrefs(): SearchPrefs | null {
  try {
    return JSON.parse(localStorage.getItem(PREFS) || "null") as SearchPrefs | null;
  } catch {
    return null;
  }
}
export function savePrefs(value: SearchPrefs) {
  localStorage.setItem(PREFS, JSON.stringify(value));
}

const DEVICE = "lh_device";
const THEME = "lh_theme";

/** Identificador deste aparelho, usado para limitar quantos aparelhos usam a mesma key. */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE);
    if (!id || id.length < 8) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE, id);
    }
    return id;
  } catch {
    return "sem-armazenamento-0000";
  }
}

export type Theme = "light" | "dark";
export function loadTheme(): Theme {
  try {
    // O tema escuro é o padrão; uma escolha explícita de tema claro continua sendo respeitada.
    return localStorage.getItem(THEME) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
export function saveTheme(value: Theme) {
  localStorage.setItem(THEME, value);
}

/** Apaga os dados guardados no navegador (ao sair), para o próximo usuário não ver leads de outro. */
export function clearLocalData() {
  // Remove também dados de perfil e preferências da conta anterior para
  // evitar que outra pessoa veja informações ao entrar no mesmo aparelho.
  for (const name of [
    PIPE,
    MSG,
    FOLLOW,
    TICKET,
    PREFS,
    GOAL,
    DAILY,
    RECENT,
    USER,
    NOTIFICATIONS,
    ANN,
    "lh_search_activity",
    "lh_custom_messages",
    "lh_profile_photo",
  ]) {
    try {
      localStorage.removeItem(name);
    } catch {
      // O navegador pode bloquear o armazenamento; o logout deve continuar.
    }
  }
}

const DAILY = "lh_daily_goal";
export function loadDailyGoal() {
  try {
    return Number(localStorage.getItem(DAILY)) || 0;
  } catch {
    return 0;
  }
}
export function saveDailyGoal(value: number) {
  localStorage.setItem(DAILY, String(value));
}

const ANN = "lh_ann_dismissed";
export function loadAnnDismissed() {
  try {
    return localStorage.getItem(ANN) || "";
  } catch {
    return "";
  }
}
export function saveAnnDismissed(text: string) {
  localStorage.setItem(ANN, text);
}

const RECENT = "lh_recent_searches";
export type RecentSearch = { city: string; niche: string };

export function loadRecent(): RecentSearch[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT) || "[]") as RecentSearch[];
    return Array.isArray(list) ? list.slice(0, 6) : [];
  } catch {
    return [];
  }
}
export function saveRecent(list: RecentSearch[]) {
  localStorage.setItem(RECENT, JSON.stringify(list.slice(0, 6)));
}

const GOAL = "lh_goal";
const TOUR = "lh_tour_done";

export function loadGoal() {
  try {
    return Number(localStorage.getItem(GOAL)) || 0;
  } catch {
    return 0;
  }
}
export function saveGoal(value: number) {
  localStorage.setItem(GOAL, String(value));
}
export function loadTourDone() {
  try {
    return localStorage.getItem(TOUR) === "1";
  } catch {
    return true;
  }
}
export function saveTourDone() {
  localStorage.setItem(TOUR, "1");
}


export type SearchActivity = { id: string; at: string; city: string; niche: string; count: number; businesses?: string[] };
export type CustomMessage = { id: string; name: string; text: string; category: string };

const SEARCH_ACTIVITY = "lh_search_activity";
const CUSTOM_MESSAGES = "lh_custom_messages";
const PROFILE_PHOTO = "lh_profile_photo";
const NOTIFICATIONS = "lh_notifications";

export function loadSearchActivity(): SearchActivity[] {
  try {
    const list = JSON.parse(localStorage.getItem(SEARCH_ACTIVITY) || "[]") as SearchActivity[];
    return Array.isArray(list) ? list.slice(-1000) : [];
  } catch { return []; }
}
export function saveSearchActivity(list: SearchActivity[]) {
  localStorage.setItem(SEARCH_ACTIVITY, JSON.stringify(list.slice(-1000)));
}
export function loadCustomMessages(): CustomMessage[] {
  try {
    const list = JSON.parse(localStorage.getItem(CUSTOM_MESSAGES) || "[]") as CustomMessage[];
    return Array.isArray(list) ? list.slice(0, 100) : [];
  } catch { return []; }
}
export function saveCustomMessages(list: CustomMessage[]) {
  localStorage.setItem(CUSTOM_MESSAGES, JSON.stringify(list.slice(0, 100)));
}
export function loadProfilePhoto() {
  try { return localStorage.getItem(PROFILE_PHOTO) || ""; } catch { return ""; }
}
export function saveProfilePhoto(value: string) {
  if (value) localStorage.setItem(PROFILE_PHOTO, value);
  else localStorage.removeItem(PROFILE_PHOTO);
}
export function loadNotificationsEnabled() {
  try { return localStorage.getItem(NOTIFICATIONS) === "1"; } catch { return false; }
}
export function saveNotificationsEnabled(value: boolean) {
  localStorage.setItem(NOTIFICATIONS, value ? "1" : "0");
}
