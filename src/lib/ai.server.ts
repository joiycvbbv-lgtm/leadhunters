export class AiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

/** Chama o Claude pela API da Anthropic (a chave fica só no servidor). */
export async function callClaude(options: { system: string; user: string; maxTokens: number; temperature?: number }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiError("IA_NAO_CONFIGURADA");
  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: options.maxTokens,
        temperature: options.temperature ?? 0.7,
        system: options.system,
        messages: [{ role: "user", content: options.user }],
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    throw new AiError("IA_DEMOROU");
  }
  if (response.status === 401 || response.status === 403) throw new AiError("IA_CHAVE_INVALIDA");
  if (response.status === 429 || response.status === 529) throw new AiError("IA_OCUPADA");
  if (!response.ok) throw new AiError("IA_ERRO");
  const json = (await response.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
  const text = (json?.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();
  if (!text) throw new AiError("IA_ERRO");
  return text;
}

/** Extrai o primeiro objeto JSON de uma resposta (mesmo que venha com texto em volta). */
export function extractJson<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export const AI_MESSAGES: Record<string, string> = {
  IA_NAO_CONFIGURADA: "A IA ainda não foi ligada neste site. O dono precisa criar a variável ANTHROPIC_API_KEY na Vercel.",
  IA_CHAVE_INVALIDA: "A chave da IA configurada no site foi recusada. O dono precisa conferir a ANTHROPIC_API_KEY.",
  IA_OCUPADA: "A IA está ocupada agora. Tente de novo em alguns segundos.",
  IA_DEMOROU: "A IA demorou demais para responder. Tente de novo, ou use o prompt rápido.",
  IA_ERRO: "A IA não conseguiu responder agora. Tente de novo.",
};
