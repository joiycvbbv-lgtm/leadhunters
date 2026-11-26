import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type AuditItem = { ok: boolean; label: string; detail?: string };
export type AuditData = {
  url: string;
  finalUrl: string;
  score: number;
  seconds: number;
  items: AuditItem[];
  issues: string[];
};

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase().split("%", 1)[0] || "";
    let normalized = lower;
    const ipv4Tail = lower.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (ipv4Tail) {
      if (isIP(ipv4Tail) !== 4) return true;
      const octets = ipv4Tail.split(".").map(Number);
      const high = (octets[0] << 8) | octets[1];
      const low = (octets[2] << 8) | octets[3];
      normalized = lower.slice(0, -ipv4Tail.length) + high.toString(16) + ":" + low.toString(16);
    }

    const halves = normalized.split("::");
    if (halves.length > 2) return true;
    const left = halves[0] ? halves[0].split(":") : [];
    const right = halves[1] ? halves[1].split(":") : [];
    const zeroCount = 8 - left.length - right.length;
    if (zeroCount < 0 || (halves.length === 1 && zeroCount !== 0)) return true;
    const words = [...left, ...Array(zeroCount).fill("0"), ...right].map((part) => Number.parseInt(part || "0", 16));
    if (words.length !== 8 || words.some((word) => !Number.isFinite(word) || word < 0 || word > 0xffff)) return true;

    if (words.every((word) => word === 0) || (words.slice(0, 7).every((word) => word === 0) && words[7] === 1)) return true;
    if ((words[0] & 0xfe00) === 0xfc00) return true; // unique-local
    if ((words[0] & 0xffc0) === 0xfe80) return true; // link-local
    if ((words[0] & 0xff00) === 0xff00) return true; // multicast
    if (words[0] === 0x2001 && words[1] === 0x0db8) return true; // documentation range
    if (words[0] === 0x2001 && words[1] === 0) return true; // Teredo transition range

    const embeddedIpv4 =
      words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff
        ? [words[6] >> 8, words[6] & 0xff, words[7] >> 8, words[7] & 0xff].join(".")
        : words.slice(0, 6).every((word) => word === 0)
          ? [words[6] >> 8, words[6] & 0xff, words[7] >> 8, words[7] & 0xff].join(".")
          : words[0] === 0x2002
            ? [words[1] >> 8, words[1] & 0xff, words[2] >> 8, words[2] & 0xff].join(".")
            : words[0] === 0x0064 && words[1] === 0xff9b && words.slice(2, 6).every((word) => word === 0)
              ? [words[6] >> 8, words[6] & 0xff, words[7] >> 8, words[7] & 0xff].join(".")
              : null;
    return embeddedIpv4 ? isPrivateIp(embeddedIpv4) : false;
  }
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b, c] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

async function assertPublic(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocolo");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("porta");
  if (url.username || url.password) throw new Error("credenciais");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("privado");
    return url;
  }
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) throw new Error("privado");
  return url;
}

async function fetchPage(raw: string, hops = 0): Promise<{ finalUrl: string; html: string; ms: number; status: number }> {
  const url = await assertPublic(raw);
  const started = Date.now();
  const response = await fetch(url.toString(), {
    redirect: "manual",
    signal: AbortSignal.timeout(7000),
    headers: { "user-agent": "Mozilla/5.0 (compatible; LeadHunterAudit)", "accept-language": "pt-BR,pt;q=0.9", accept: "text/html" },
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location || hops >= 4) throw new Error("redirecionamentos");
    return fetchPage(new URL(location, url).toString(), hops + 1);
  }
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (reader) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    received += value.length;
    if (received > 400_000) {
      await reader.cancel();
      break;
    }
  }
  const html = new TextDecoder("utf-8").decode(Buffer.concat(chunks));
  return { finalUrl: url.toString(), html, ms: Date.now() - started, status: response.status };
}

export async function auditUrl(raw: string): Promise<AuditData> {
  const page = await fetchPage(raw);
  return analyze(raw, page.finalUrl, page.html, page.ms);
}

export function analyze(raw: string, finalUrl: string, html: string, ms: number): AuditData {
  const page = { finalUrl, ms };
  const items: AuditItem[] = [];
  const issues: string[] = [];
  let score = 100;
  const check = (ok: boolean, label: string, issue: string, penalty: number, detail?: string) => {
    items.push({ ok, label, detail });
    if (!ok) {
      issues.push(issue);
      score -= penalty;
    }
  };

  check(page.finalUrl.startsWith("https://"), "Conexão segura (HTTPS)", "não tem o cadeado de segurança (HTTPS), e o navegador avisa que o site é “não seguro”", 20);
  check(/<meta[^>]+name=["']viewport["']/i.test(html), "Adaptado para celular", "não está adaptado para o celular", 25);
  const seconds = Math.round((page.ms / 1000) * 10) / 10;
  check(page.ms <= 3000, "Velocidade de resposta", `demora cerca de ${seconds} segundos para responder`, page.ms > 5000 ? 20 : 10, `${seconds} s`);
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  check(title.length >= 6, "Título da página", "não tem um título claro para o Google mostrar na busca", 10, title.slice(0, 60));
  check(/<meta[^>]+name=["']description["'][^>]*content=["'][^"']{20,}/i.test(html), "Descrição para o Google", "não tem descrição para aparecer melhor nas buscas", 5);
  check(/wa\.me|api\.whatsapp\.com|whatsapp/i.test(html), "Botão de WhatsApp", "não tem botão de WhatsApp para o cliente chamar", 10);
  const years = [...html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,40}((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)].map((m) => Number(m[2] ?? m[1]));
  if (years.length) {
    const latest = Math.max(...years);
    const old = latest <= new Date().getFullYear() - 3;
    check(!old, "Conteúdo atualizado", `o rodapé mostra o ano ${latest}, o que passa a impressão de site abandonado`, 15, String(latest));
  }
  check(!/<frameset|shockwave-flash|\.swf/i.test(html), "Tecnologia atual", "usa tecnologia antiga que não funciona mais em muitos aparelhos", 15);

  return { url: raw, finalUrl: page.finalUrl, score: Math.max(0, score), seconds, items, issues };
}
