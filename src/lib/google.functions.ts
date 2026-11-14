import { createServerFn } from "@tanstack/react-start";

export type LinkResult =
  | {
      ok: true;
      token: string;
      info: { kind: "full" | "test"; buyer: string; expiresAt: string | null; dailyLimit: number; usedToday: number };
    }
  | { ok: false; error: string };

/** Liga a conta Google a uma key (primeira vez). Depois disso, o login com Google entra direto. */
export const linkGoogle = createServerFn({ method: "POST" })
  .validator((data: { ticket: string; key: string; deviceId: string }) => ({
    ticket: String(data?.ticket || ""),
    key: String(data?.key || ""),
    deviceId: String(data?.deviceId || ""),
  }))
  .handler(async ({ data }): Promise<LinkResult> => {
    try {
      const { readBlob, checkAccess, issueSessionToken, isSessionToken } = await import("./keys.server");
      const { getDb } = await import("./db-app.server");
      const who = readBlob<{ sub: string; email: string; name: string }>(data.ticket, "glink");
      if (!who) return { ok: false, error: "A conexão com o Google expirou. Toque em “Entrar com Google” de novo." };
      if (isSessionToken(data.key)) return { ok: false, error: "Digite o texto da sua key, no formato LH-XXXX-XXXX-XXXX-XXXX." };

      const access = await checkAccess(data.key, data.deviceId, true);
      if (!access.ok) {
        const messages: Record<string, string> = {
          KEY_REVOGADA: "Essa key foi desativada.",
          KEY_EXPIRADA: "Essa key venceu.",
          APARELHOS: "Essa key já está no máximo de aparelhos permitido.",
        };
        if (access.code === "KEY_INVALIDA") await new Promise((resolve) => setTimeout(resolve, 700));
        return { ok: false, error: messages[access.code] ?? "Key inválida. Confira e tente de novo." };
      }

      const sql = await getDb();
      const existing = await sql.query<{ sub: string }>("select sub from google_links where key_id = $1", [access.keyId]);
      if (existing[0] && existing[0].sub !== who.sub) {
        return { ok: false, error: "Essa key já está ligada a outra conta Google. Peça ao suporte para desvincular." };
      }
      if (!existing[0]) {
        await sql.query(
          "insert into google_links (sub, email, name, key_id) values ($1,$2,$3,$4) on conflict (sub) do nothing",
          [who.sub, who.email.slice(0, 200), who.name.slice(0, 120), access.keyId],
        );
        const check = await sql.query<{ key_id: number }>("select key_id from google_links where sub = $1", [who.sub]);
        if (check[0]?.key_id !== access.keyId) {
          return { ok: false, error: "Essa conta Google já está ligada a outra key." };
        }
      }
      return { ok: true, token: issueSessionToken(access.keyId), info: access.info };
    } catch (error) {
      console.error("[linkGoogle]", error);
      return { ok: false, error: "Erro no servidor. Tente de novo." };
    }
  });
