import { createServerFn } from "@tanstack/react-start";

export type AiCopy = {
  tagline: string;
  about: string;
  highlights: string[];
  items: { name: string; desc: string; price: string }[];
  design: "editorial" | "urbano" | "limpo" | "vitrine";
  color: string;
  warnings: string[];
};

type Auth = { key: string; deviceId: string };
export type AiFacts = {
  name: string;
  kindLabel: string;
  category: string;
  city: string;
  address: string;
  notes: string;
  hasHours: boolean;
  tone: "direto" | "acolhedor" | "premium";
};

const clean = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, max);

function validFacts(data: Partial<AiFacts> | undefined): AiFacts {
  return {
    name: clean(data?.name, 90),
    kindLabel: clean(data?.kindLabel, 80),
    category: clean(data?.category, 80),
    city: clean(data?.city, 80),
    address: clean(data?.address, 200),
    notes: clean(data?.notes, 1500),
    hasHours: Boolean(data?.hasHours),
    tone: data?.tone === "acolhedor" || data?.tone === "premium" ? data.tone : "direto",
  };
}

const TONES: Record<AiFacts["tone"], string> = {
  direto: "direto e simples, como uma pessoa do bairro explicando o que faz",
  acolhedor: "caloroso e próximo, sem exagero e sem diminutivos em excesso",
  premium: "sóbrio e refinado, com poucas palavras e nenhuma gíria",
};

async function guardAi(auth: Auth) {
  const { checkAccess } = await import("./keys.server");
  const { getDb } = await import("./db-app.server");
  const access = await checkAccess(auth.key, auth.deviceId, false);
  if (!access.ok) return { ok: false, error: access.code as string } as const;
  if (access.info.kind === "test") return { ok: false, error: "A key de teste não usa a IA. Escolha um plano." as string } as const;
  const limit = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 8);
  const sql = await getDb();
  const rows = await sql.query<{ count: number }>(
    `insert into ai_usage (key_id, day, count) values ($1, (now() at time zone 'America/Sao_Paulo')::date, 1)
     on conflict (key_id, day) do update set count = ai_usage.count + 1 where ai_usage.count < $2
     returning count`,
    [access.keyId, limit],
  );
  if (!rows.length) return { ok: false, error: `Você usou as ${limit} gerações de IA de hoje. Elas voltam amanhã.` as string } as const;
  return { ok: true, keyId: access.keyId, used: rows[0].count, limit } as const;
}

async function refund(keyId: number) {
  const { getDb } = await import("./db-app.server");
  const sql = await getDb();
  await sql.query(
    "update ai_usage set count = greatest(count - 1, 0) where key_id = $1 and day = (now() at time zone 'America/Sao_Paulo')::date",
    [keyId],
  );
}

const COPY_SYSTEM = `Você escreve textos de sites para pequenos negócios locais do Brasil. Seu texto precisa parecer escrito por uma pessoa de verdade, não por uma IA.

REGRAS DE ESTILO
- Português do Brasil natural, frases curtas, palavras do dia a dia.
- Concreto e específico. Fale do que a empresa faz, em que bairro ou cidade fica, para quem serve.
- PROIBIDO usar: soluções, excelência, referência, tradição e qualidade, paixão, apaixonados, inigualável, melhor da região, experiência única, venha conferir, nossa missão, compromisso com, líder, inovação, diferenciado, personalizado, sob medida, qualidade e atendimento, "mais do que", "muito mais que", "há anos", "desde".
- Sem emojis. No máximo uma exclamação em todo o texto. Sem perguntas retóricas. Sem "bem-vindo".

REGRAS DE VERDADE (as mais importantes)
- Use SOMENTE os fatos recebidos. NUNCA invente produtos, preços, anos de existência, números, prêmios, equipe, certificações, depoimentos ou promoções.
- Se uma informação não foi dada, não escreva sobre ela. Prefira texto curto e verdadeiro a texto longo e inventado.
- "items" só pode ter itens que aparecem nas observações do vendedor. O preço só entra se estiver escrito lá; senão use "".
- "highlights" só com fatos das observações. Se não houver, devolva lista vazia.
- Escolha um layout existente: editorial, urbano, limpo ou vitrine, conforme o negócio.
- Escolha uma cor principal hexadecimal de seis dígitos que combine com o negócio e tenha bom contraste.
- Não invente informação da empresa nem gere código HTML; o painel constrói a prévia com segurança.

FORMATO: responda APENAS com um JSON válido, sem comentários e sem markdown, neste formato:
{"tagline": "até 70 caracteres, ou \\"\\" se não houver algo verdadeiro e específico para dizer",
 "about": "2 a 3 frases curtas, até 380 caracteres",
 "highlights": ["até 5 itens, cada um com até 60 caracteres"],
 "items": [{"name": "", "desc": "até 120 caracteres", "price": ""}],
 "design": "editorial | urbano | limpo | vitrine",
 "color": "#hexadecimal de seis dígitos",
 "warnings": ["o que está faltando para o texto ficar melhor, em frases curtas"]}`;

export const aiCopy = createServerFn({ method: "POST" })
  .validator((data: Auth & { facts: AiFacts }) => ({
    key: String(data?.key || ""),
    deviceId: String(data?.deviceId || ""),
    facts: validFacts(data?.facts),
  }))
  .handler(
    async ({ data }): Promise<{ ok: true; copy: AiCopy; usage: { used: number; limit: number } } | { ok: false; error: string }> => {
      const guard = await guardAi(data);
      if (!guard.ok) return { ok: false, error: guard.error };
      try {
        const { callClaude, extractJson, AiError, AI_MESSAGES } = await import("./ai.server");
        const f = data.facts;
        const user = `Escreva os textos do site desta empresa.\n\nTom: ${TONES[f.tone]}.\n\nFATOS CONFIRMADOS\n- Nome: ${f.name}\n- Tipo de negócio: ${f.kindLabel}${f.category ? ` (categoria: ${f.category})` : ""}\n- Cidade: ${f.city || "não informada"}\n- Endereço: ${f.address || "não informado"}\n\nOBSERVAÇÕES DO VENDEDOR (o que a empresa vende ou faz, diferenciais, preços):\n${f.notes || "(nenhuma observação)"}`;
        let text: string;
        try {
          text = await callClaude({ system: COPY_SYSTEM, user, maxTokens: 1100, temperature: 0.6 });
        } catch (error) {
          await refund(guard.keyId);
          const code = error instanceof AiError ? error.code : "IA_ERRO";
          return { ok: false, error: AI_MESSAGES[code] ?? AI_MESSAGES.IA_ERRO };
        }
        const raw = extractJson<Partial<AiCopy>>(text);
        if (!raw) {
          await refund(guard.keyId);
          return { ok: false, error: "A IA devolveu um texto fora do formato. Tente de novo." };
        }
        const list = (value: unknown, max: number, size: number) =>
          (Array.isArray(value) ? value : []).map((item) => clean(item, size)).filter(Boolean).slice(0, max);
        return {
          ok: true,
          usage: { used: guard.used, limit: guard.limit },
          copy: {
            tagline: clean(raw.tagline, 90),
            about: clean(raw.about, 600),
            design: (["editorial", "urbano", "limpo", "vitrine"] as const).includes(raw.design as AiCopy["design"])
              ? (raw.design as AiCopy["design"])
              : "limpo",
            color: /^#[0-9a-fA-F]{6}$/.test(String(raw.color || "")) ? String(raw.color) : "#1d6fe0",
            highlights: list(raw.highlights, 5, 80),
            items: (Array.isArray(raw.items) ? raw.items : [])
              .map((item) => ({
                name: clean((item as { name?: string })?.name, 80),
                desc: clean((item as { desc?: string })?.desc, 160),
                price: clean((item as { price?: string })?.price, 24),
              }))
              .filter((item) => item.name)
              .slice(0, 20),
            warnings: list(raw.warnings, 4, 140),
          },
        };
      } catch (error) {
        console.error("[aiCopy]", error);
        await refund(guard.keyId).catch(() => undefined);
        return { ok: false, error: "Erro no servidor. Tente de novo." };
      }
    },
  );

const BRIEF_SYSTEM = `Você escreve briefings criativos para OUTRA inteligência artificial (o Claude) construir o site de uma empresa local brasileira. O briefing precisa levar a um site com cara de agência profissional, e NÃO com cara de site feito por IA.

Escreva em português do Brasil, em texto corrido organizado nas seções abaixo, com títulos em MAIÚSCULAS. No máximo 650 palavras. Sem markdown, sem asteriscos, sem emojis.

SEÇÕES
1. CONCEITO: uma ideia visual única e específica para ESTE negócio, pensada a partir do tipo de negócio, da cidade e do clima do lugar. Nada genérico.
2. DIREÇÃO VISUAL: paleta com 3 a 4 cores em hexadecimal (e por que combinam com este negócio), duas fontes do Google Fonts (uma para títulos, outra para texto), estilo de layout, uso de espaço e de grid.
3. ESTRUTURA: ordem das seções e o que cada uma deve mostrar, com foco em levar o cliente a chamar no WhatsApp.
4. TOM DE VOZ: como os textos devem soar, com 3 exemplos curtos de títulos ou chamadas que NÃO inventem fatos.
5. DETALHES QUE DIFERENCIAM: 4 a 6 detalhes de design e de interação que dão sensação de trabalho artesanal (microinterações discretas, tipografia, alinhamentos, ritmo).
6. O QUE EVITAR: lista curta do que denuncia "site de IA": gradientes roxos e azuis, blocos de três cartões iguais com ícone, emojis como ícones, frases como "Bem-vindo ao" e "soluções", centralizar tudo, sombras e brilhos exagerados, texto de enchimento.

REGRAS
- Não invente fatos sobre a empresa (preços, anos, prêmios, equipe, produtos). Use apenas os dados recebidos.
- Onde faltar informação, oriente a IA a deixar marcadores visíveis do tipo [EDITAR: ...].
- Não repita os dados da empresa no briefing, eles serão anexados depois. Foque na direção criativa.`;

export const aiBrief = createServerFn({ method: "POST" })
  .validator((data: Auth & { facts: AiFacts; style: string; format: string }) => ({
    key: String(data?.key || ""),
    deviceId: String(data?.deviceId || ""),
    facts: validFacts(data?.facts),
    style: clean(data?.style, 160),
    format: clean(data?.format, 40),
  }))
  .handler(
    async ({ data }): Promise<{ ok: true; brief: string; usage: { used: number; limit: number } } | { ok: false; error: string }> => {
      const guard = await guardAi(data);
      if (!guard.ok) return { ok: false, error: guard.error };
      try {
        const { callClaude, AiError, AI_MESSAGES } = await import("./ai.server");
        const f = data.facts;
        const user = `Faça o briefing criativo para o site desta empresa.\n\n- Nome: ${f.name}\n- Tipo de negócio: ${f.kindLabel}${f.category ? ` (categoria: ${f.category})` : ""}\n- Cidade: ${f.city || "não informada"}\n- Estilo pedido pelo vendedor: ${data.style || "livre"}\n- Tom de voz: ${TONES[f.tone]}\n- Observações do vendedor: ${f.notes || "(nenhuma)"}`;
        try {
          const brief = await callClaude({ system: BRIEF_SYSTEM, user, maxTokens: 1400, temperature: 0.8 });
          return { ok: true, brief: clean(brief, 6000), usage: { used: guard.used, limit: guard.limit } };
        } catch (error) {
          await refund(guard.keyId);
          const code = error instanceof AiError ? error.code : "IA_ERRO";
          return { ok: false, error: AI_MESSAGES[code] ?? AI_MESSAGES.IA_ERRO };
        }
      } catch (error) {
        console.error("[aiBrief]", error);
        await refund(guard.keyId).catch(() => undefined);
        return { ok: false, error: "Erro no servidor. Tente de novo." };
      }
    },
  );
