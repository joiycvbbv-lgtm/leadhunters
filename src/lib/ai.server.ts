export class AiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

// Flash-Lite is optimized for low-latency tasks; keep Flash models available
// as explicit overrides through GEMINI_MODEL.
const ACTIVE_MODELS = new Set(["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"]);

function selectedModel() {
  const requested = process.env.GEMINI_MODEL?.trim();
  return requested && ACTIVE_MODELS.has(requested) ? requested : "gemini-3.5-flash-lite";
}

/** Chama o Gemini pela API do Google; a chave fica somente no servidor. */
export async function callGemini(options: { system: string; user: string; maxTokens: number; temperature?: number }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new AiError("IA_NAO_CONFIGURADA");
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel()}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: "user", parts: [{ text: options.user }] }],
        generationConfig: {
          maxOutputTokens: options.maxTokens,
          temperature: options.temperature ?? 0.7,
        },
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    throw new AiError("IA_DEMOROU");
  }
  if (response.status === 400 || response.status === 401 || response.status === 403) throw new AiError("IA_CHAVE_INVALIDA");
  if (response.status === 429 || response.status === 503) throw new AiError("IA_OCUPADA");
  if (!response.ok) throw new AiError("IA_ERRO");
  const json = (await response.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const text = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
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
  IA_NAO_CONFIGURADA: "A IA precisa da variável GEMINI_API_KEY nas configurações da Vercel. O Gemini 3.5 Flash-Lite está selecionado por padrão para respostas mais rápidas.",
  IA_CHAVE_INVALIDA: "A chave do Google configurada no site foi recusada. O dono precisa conferir a GEMINI_API_KEY ou a GOOGLE_API_KEY.",
  IA_OCUPADA: "A IA está ocupada agora. Tente de novo em alguns segundos.",
  IA_DEMOROU: "A IA demorou demais para responder. Tente de novo, ou use o prompt rápido.",
  IA_ERRO: "A IA não conseguiu responder agora. Tente de novo.",
};
