import { createServerFn } from "@tanstack/react-start";

/* ---------- Aviso para todos os clientes ---------- */

export const getAnnouncement = createServerFn({ method: "POST" })
  .validator((data: { key: string; deviceId: string }) => ({
    key: String(data?.key || ""),
    deviceId: String(data?.deviceId || ""),
  }))
  .handler(async ({ data }): Promise<{ text: string }> => {
    try {
      const { checkAccess } = await import("./keys.server");
      const { getDb } = await import("./db-app.server");
      const access = await checkAccess(data.key, data.deviceId, false);
      if (!access.ok) return { text: "" };
      const sql = await getDb();
      const rows = await sql.query<{ value: string }>("select value from app_settings where key = 'announcement'");
      return { text: rows[0]?.value ?? "" };
    } catch {
      return { text: "" };
    }
  });

/* ---------- Teste grátis ---------- */

export type TrialResult = { ok: true; key: string } | { ok: false; error: string };

export const requestTrial = createServerFn({ method: "POST" })
  .validator((data: { name: string; whatsapp: string; deviceId: string }) => ({
    name: String(data?.name || "").trim().slice(0, 80),
    whatsapp: String(data?.whatsapp || "").replace(/\D/g, ""),
    deviceId: String(data?.deviceId || "").slice(0, 80),
  }))
  .handler(async ({ data }): Promise<TrialResult> => {
    try {
      let phone = data.whatsapp;
      if (phone.startsWith("55") && phone.length >= 12) phone = phone.slice(2);
      if (data.name.length < 2) return { ok: false, error: "Digite o seu nome." };
      if (phone.length !== 10 && phone.length !== 11) return { ok: false, error: "Digite o WhatsApp com DDD." };
      if (data.deviceId.length < 8) return { ok: false, error: "Não consegui identificar este aparelho." };

      const { dbConfigured, getDb } = await import("./db-app.server");
      if (!dbConfigured()) return { ok: false, error: "O servidor ainda não tem banco de dados." };
      const { createKeys } = await import("./keys.server");
      const sql = await getDb();

      const day = await sql.query<{ n: number }>(
        "select count(*) as n from trials where created_at > now() - interval '24 hours'",
      );
      if ((day[0]?.n ?? 0) >= 50) {
        return { ok: false, error: "Muitos testes hoje. Tente amanhã ou veja os planos." };
      }
      const used = await sql.query("select 1 from trials where whatsapp = $1 or device_id = $2 limit 1", [
        phone,
        data.deviceId,
      ]);
      if (used.length) return { ok: false, error: "Esse WhatsApp ou aparelho já usou o teste grátis. Veja os planos." };

      const [made] = await createKeys({
        count: 1,
        kind: "test",
        buyer: `Teste: ${data.name}`,
        note: `Teste grátis ${phone}`,
        dailyLimit: 3,
        maxDevices: 1,
        validMinutes: 5,
      });
      if (!made) return { ok: false, error: "Não consegui gerar o teste agora. Tente de novo." };

      const saved = await sql.query<{ id: number }>(
        "insert into trials (name, whatsapp, device_id, key_id) values ($1,$2,$3,$4) on conflict do nothing returning id",
        [data.name, phone, data.deviceId, made.id],
      );
      if (!saved.length) {
        await sql.query("delete from access_keys where id = $1", [made.id]);
        return { ok: false, error: "Esse WhatsApp ou aparelho já usou o teste grátis. Veja os planos." };
      }
      return { ok: true, key: made.key };
    } catch (error) {
      console.error("[requestTrial]", error);
      return { ok: false, error: "Erro no servidor. Tente de novo em instantes." };
    }
  });
