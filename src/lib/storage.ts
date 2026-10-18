import { DEFAULT_FOLLOW_MSG, DEFAULT_MSG } from "./templates";

export { DEFAULT_FOLLOW_MSG, DEFAULT_MSG };

export type Status = "novo" | "contatado" | "proposta" | "fechado" | "perdido";

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

export type SearchPrefs = { city: string; niche: string; quantity: number; minRating: number };

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
    return localStorage.getItem(THEME) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
export function saveTheme(value: Theme) {
  localStorage.setItem(THEME, value);
}

/** Apaga os dados guardados no navegador (ao sair), para o próximo usuário não ver leads de outro. */
export function clearLocalData() {
  for (const name of [PIPE, MSG, FOLLOW, TICKET, PREFS]) localStorage.removeItem(name);
}
