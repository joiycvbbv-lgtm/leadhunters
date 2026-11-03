import { createServerFn } from "@tanstack/react-start";
import type { AuditData } from "./audit.server";

export type AuditResult = ({ ok: true } & AuditData) | { ok: false; error: string };

export const auditSite = createServerFn({ method: "POST" })
  .validator((data: { key: string; deviceId: string; url: string }) => ({
    key: String(data?.key || ""),
    deviceId: String(data?.deviceId || ""),
    url: String(data?.url || "").trim().slice(0, 500),
  }))
  .handler(async ({ data }): Promise<AuditResult> => {
    try {
      const { checkAccess } = await import("./keys.server");
      const { getDb } = await import("./db-app.server");
      const access = await checkAccess(data.key, data.deviceId, false);
      if (!access.ok) return { ok: false, error: access.code };
      if (!/^https?:\/\//i.test(data.url)) return { ok: false, error: "Endereço de site inválido." };

      // Limite diário de análises por key, para ninguém usar o painel como ferramenta de ataque.
      const sql = await getDb();
      const used = await sql.query<{ count: number }>(
        `insert into audit_usage (key_id, day, count) values ($1, (now() at time zone 'America/Sao_Paulo')::date, 1)
         on conflict (key_id, day) do update set count = audit_usage.count + 1 where audit_usage.count < 40
         returning count`,
        [access.keyId],
      );
      if (!used.length) return { ok: false, error: "Você usou as 40 análises de hoje. Elas voltam amanhã." };

      const { auditUrl } = await import("./audit.server");
      try {
        return { ok: true, ...(await auditUrl(data.url)) };
      } catch {
        return { ok: false, error: "Não consegui abrir esse site. Ele pode estar fora do ar, e isso também é um bom argumento de venda." };
      }
    } catch (error) {
      console.error("[auditSite]", error);
      return { ok: false, error: "Erro no servidor. Tente de novo." };
    }
  });
