import { createServerFn } from "@tanstack/react-start";

export type AdminKey = {
  id: number;
  key: string | null;
  hint: string;
  kind: string;
  status: string;
  buyer: string;
  note: string;
  dailyLimit: number;
  maxDevices: number;
  devices: number;
  usedToday: number;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  plan: string;
  amountCents: number;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string;
  status: string;
  keyHint: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type AdminTrial = { id: number; name: string; whatsapp: string; createdAt: string };

export type AdminDay = { day: string; searches: number; sales: number; revenueCents: number };

export type AdminExpiring = {
  id: number;
  hint: string;
  buyer: string;
  expiresAt: string;
  whatsapp: string | null;
};

export type AdminOverview = {
  ok: true;
  keys: AdminKey[];
  orders: AdminOrder[];
  daily: AdminDay[];
  expiring: AdminExpiring[];
  trials: AdminTrial[];
  announcement: string;
  stats: {
    totalKeys: number;
    activeKeys: number;
    inUse: number;
    searchesToday: number;
    paidOrders: number;
    revenueCents: number;
  };
};

export type AdminFail = { ok: false; code: string };

const T = (data: { token: string }) => String(data?.token || "");

async function guard(token: string) {
  const { verifyAdminToken } = await import("./keys.server");
  return verifyAdminToken(token);
}

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => ({ password: String(data?.password || "") }))
  .handler(async ({ data }): Promise<{ ok: true; token: string } | AdminFail> => {
    const { checkAdminPassword, issueAdminToken } = await import("./keys.server");
    const result = checkAdminPassword(data.password);
    if (result === "sem-senha") return { ok: false, code: "SEM_SENHA" };
    if (result === "errada") {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return { ok: false, code: "SENHA_ERRADA" };
    }
    return { ok: true, token: issueAdminToken() };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => ({ token: T(data) }))
  .handler(async ({ data }): Promise<AdminOverview | AdminFail> => {
    if (!(await guard(data.token))) return { ok: false, code: "SESSAO" };
    const { getDb: getSql } = await import("./db-app.server");
    const sql = await getSql();

    const keys = await sql.query<{
      id: number;
      key_plain: string | null;
      key_hash: string;
      kind: string;
      status: string;
      buyer: string;
      note: string;
      daily_limit: number;
      max_devices: number;
      devices: number;
      used_today: number;
      activated_at: string | null;
      expires_at: string | null;
      created_at: string;
    }>(
      `select k.id, k.key_plain, k.key_hash, k.kind, k.status, k.buyer, k.note, k.daily_limit, k.max_devices,
              (select count(*) from key_devices d where d.key_id = k.id) as devices,
              coalesce((select u.count from search_usage u where u.key_id = k.id and u.day = (now() at time zone 'America/Sao_Paulo')::date), 0) as used_today,
              to_char(k.activated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as activated_at, to_char(k.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at, to_char(k.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
         from access_keys k order by k.id desc limit 1000`,
    );

    const orders = await sql.query<{
      id: string;
      plan: string;
      amount_cents: number;
      buyer_name: string;
      buyer_email: string;
      buyer_whatsapp: string;
      status: string;
      key_plain: string | null;
      created_at: string;
      paid_at: string | null;
    }>(
      `select o.id, o.plan, o.amount_cents, o.buyer_name, o.buyer_email, o.buyer_whatsapp, o.status,
              k.key_plain, to_char(o.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at, to_char(o.paid_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as paid_at
         from orders o left join access_keys k on k.id = o.key_id
        order by o.created_at desc limit 100`,
    );

    const revenue = await sql.query<{ paid: number; cents: number }>(
      "select count(*) as paid, coalesce(sum(amount_cents), 0) as cents from orders where status = 'pago'",
    );
    const searches = await sql.query<{ n: number }>(
      "select coalesce(sum(count), 0) as n from search_usage where day = (now() at time zone 'America/Sao_Paulo')::date",
    );

    const days = await sql.query<{ day: string; searches: number; sales: number; cents: number }>(
      `select to_char(d::date, 'YYYY-MM-DD') as day,
              coalesce((select sum(u.count) from search_usage u where u.day = d::date), 0) as searches,
              coalesce((select count(*) from orders o where o.status = 'pago'
                         and (o.paid_at at time zone 'America/Sao_Paulo')::date = d::date), 0) as sales,
              coalesce((select sum(o.amount_cents) from orders o where o.status = 'pago'
                         and (o.paid_at at time zone 'America/Sao_Paulo')::date = d::date), 0) as cents
         from generate_series(
                ((now() at time zone 'America/Sao_Paulo')::date - 13)::timestamp,
                (now() at time zone 'America/Sao_Paulo')::timestamp,
                interval '1 day') as d
        order by d`,
    );

    const expiring = await sql.query<{
      id: number;
      key_plain: string | null;
      key_hash: string;
      buyer: string;
      expires_at: string;
      buyer_whatsapp: string | null;
    }>(
      `select k.id, k.key_plain, k.key_hash, k.buyer,
              to_char(k.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as expires_at,
              (select o.buyer_whatsapp from orders o where o.key_id = k.id limit 1) as buyer_whatsapp
         from access_keys k
        where k.status = 'ativa' and k.expires_at is not null
          and k.expires_at > now() and k.expires_at < now() + interval '7 days'
        order by k.expires_at limit 100`,
    );

    const trials = await sql.query<{ id: number; name: string; whatsapp: string; created_at: string }>(
      `select id, name, whatsapp,
              to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_at
         from trials order by id desc limit 50`,
    );
    const announcement = await sql.query<{ value: string }>(
      "select value from app_settings where key = 'announcement'",
    );

    return {
      ok: true,
      trials: trials.map((t) => ({ id: t.id, name: t.name, whatsapp: t.whatsapp, createdAt: t.created_at })),
      announcement: announcement[0]?.value ?? "",
      daily: days.map((d) => ({
        day: d.day,
        searches: Number(d.searches),
        sales: Number(d.sales),
        revenueCents: Number(d.cents),
      })),
      expiring: expiring.map((k) => ({
        id: k.id,
        hint: k.key_plain ? k.key_plain : `LH-…${k.key_hash.slice(0, 6).toUpperCase()}`,
        buyer: k.buyer,
        expiresAt: k.expires_at,
        whatsapp: k.buyer_whatsapp,
      })),
      keys: keys.map((k) => ({
        id: k.id,
        key: k.key_plain,
        hint: k.key_plain ? k.key_plain : `LH-…${k.key_hash.slice(0, 6).toUpperCase()}`,
        kind: k.kind,
        status: k.status,
        buyer: k.buyer,
        note: k.note,
        dailyLimit: k.daily_limit,
        maxDevices: k.max_devices,
        devices: Number(k.devices),
        usedToday: Number(k.used_today),
        activatedAt: k.activated_at,
        expiresAt: k.expires_at,
        createdAt: k.created_at,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        plan: o.plan,
        amountCents: o.amount_cents,
        buyerName: o.buyer_name,
        buyerEmail: o.buyer_email,
        buyerWhatsapp: o.buyer_whatsapp,
        status: o.status,
        keyHint: o.key_plain,
        createdAt: o.created_at,
        paidAt: o.paid_at,
      })),
      stats: {
        totalKeys: keys.length,
        activeKeys: keys.filter((k) => k.status === "ativa").length,
        inUse: keys.filter((k) => Number(k.devices) > 0).length,
        searchesToday: Number(searches[0]?.n ?? 0),
        paidOrders: Number(revenue[0]?.paid ?? 0),
        revenueCents: Number(revenue[0]?.cents ?? 0),
      },
    };
  });

export const adminCreateKeys = createServerFn({ method: "POST" })
  .validator(
    (data: {
      token: string;
      count: number;
      kind: "full" | "test";
      buyer?: string;
      note?: string;
      dailyLimit: number;
      maxDevices: number;
      validDays?: number | null;
      validMinutes?: number | null;
    }) => ({
      token: T(data),
      count: Math.min(100, Math.max(1, Math.floor(Number(data?.count) || 1))),
      kind: data?.kind === "test" ? ("test" as const) : ("full" as const),
      buyer: String(data?.buyer ?? "").slice(0, 120),
      note: String(data?.note ?? "").slice(0, 300),
      dailyLimit: Math.min(1000, Math.max(1, Math.floor(Number(data?.dailyLimit) || 30))),
      maxDevices: Math.min(10, Math.max(1, Math.floor(Number(data?.maxDevices) || 2))),
      validDays: data?.validDays ? Math.max(1, Math.floor(Number(data.validDays))) : null,
      validMinutes: data?.validMinutes ? Math.max(1, Math.floor(Number(data.validMinutes))) : null,
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true; keys: string[] } | AdminFail> => {
    if (!(await guard(data.token))) return { ok: false, code: "SESSAO" };
    const { createKeys } = await import("./keys.server");
    const made = await createKeys({
      count: data.count,
      kind: data.kind,
      buyer: data.buyer,
      note: data.note,
      dailyLimit: data.dailyLimit,
      maxDevices: data.kind === "test" ? 1 : data.maxDevices,
      validDays: data.validDays,
      validMinutes: data.kind === "test" ? (data.validMinutes ?? 5) : data.validMinutes,
    });
    return { ok: true, keys: made.map((m) => m.key) };
  });

export type AdminPatch = {
  status?: "ativa" | "revogada";
  buyer?: string;
  note?: string;
  dailyLimit?: number;
  maxDevices?: number;
  extendDays?: number;
  resetDevices?: boolean;
};

export const adminUpdateKey = createServerFn({ method: "POST" })
  .validator((data: { token: string; id: number; patch: AdminPatch }) => ({
    token: T(data),
    id: Math.floor(Number(data?.id) || 0),
    patch: (data?.patch ?? {}) as AdminPatch,
  }))
  .handler(async ({ data }): Promise<{ ok: true } | AdminFail> => {
    if (!(await guard(data.token))) return { ok: false, code: "SESSAO" };
    const { getDb: getSql } = await import("./db-app.server");
    const sql = await getSql();
    const { id, patch } = data;
    if (!id) return { ok: false, code: "ID" };

    if (patch.status === "ativa" || patch.status === "revogada") {
      await sql.query("update access_keys set status = $2 where id = $1", [id, patch.status]);
    }
    if (typeof patch.buyer === "string") {
      await sql.query("update access_keys set buyer = $2 where id = $1", [id, patch.buyer.slice(0, 120)]);
    }
    if (typeof patch.note === "string") {
      await sql.query("update access_keys set note = $2 where id = $1", [id, patch.note.slice(0, 300)]);
    }
    if (patch.dailyLimit) {
      await sql.query("update access_keys set daily_limit = $2 where id = $1", [
        id,
        Math.min(1000, Math.max(1, Math.floor(patch.dailyLimit))),
      ]);
    }
    if (patch.maxDevices) {
      await sql.query("update access_keys set max_devices = $2 where id = $1", [
        id,
        Math.min(10, Math.max(1, Math.floor(patch.maxDevices))),
      ]);
    }
    if (patch.extendDays) {
      const days = Math.min(3650, Math.floor(patch.extendDays));
      // Key já ativada: soma ao vencimento (ou a partir de agora se já venceu).
      // Key ainda não usada: aumenta a validade que vai valer no primeiro login.
      await sql.query(
        `update access_keys set
           expires_at = case when activated_at is not null and expires_at is not null
                             then greatest(expires_at, now()) + make_interval(days => $2::int) else expires_at end,
           valid_days = case when activated_at is null then coalesce(valid_days, 0) + $2::int else valid_days end
         where id = $1`,
        [id, days],
      );
    }
    if (patch.resetDevices) {
      await sql.query("delete from key_devices where key_id = $1", [id]);
    }
    return { ok: true };
  });

export const adminReconcile = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => ({ token: T(data) }))
  .handler(async ({ data }): Promise<{ ok: true; checked: number } | AdminFail> => {
    if (!(await guard(data.token))) return { ok: false, code: "SESSAO" };
    const { getDb: getSql } = await import("./db-app.server");
    const { fulfillOrder } = await import("./shop.server");
    const sql = await getSql();
    const rows = await sql.query<{ id: string }>(
      "select id from orders where status = 'pendente' or (status = 'pago' and key_id is null) order by created_at desc limit 50",
    );
    for (const row of rows) await fulfillOrder(row.id).catch(() => null);
    return { ok: true, checked: rows.length };
  });

/** Só para testes: simula o pagamento de um pedido pendente (chave de teste do AbacatePay). */
export const adminSimulatePayment = createServerFn({ method: "POST" })
  .validator((data: { token: string; orderId: string }) => ({
    token: T(data),
    orderId: String(data?.orderId || "").slice(0, 64),
  }))
  .handler(async ({ data }): Promise<{ ok: true } | AdminFail> => {
    if (!(await guard(data.token))) return { ok: false, code: "SESSAO" };
    const { getDb: getSql } = await import("./db-app.server");
    const { abacateSimulate, fulfillOrder } = await import("./shop.server");
    const sql = await getSql();
    const rows = await sql.query<{ mp_payment_id: string | null }>("select mp_payment_id from orders where id = $1", [
      data.orderId,
    ]);
    const paymentId = rows[0]?.mp_payment_id;
    if (!paymentId || /^\d+$/.test(paymentId)) return { ok: false, code: "SEM_SIMULACAO" };
    const done = await abacateSimulate(paymentId);
    if (!done) return { ok: false, code: "SIMULACAO_RECUSADA" };
    await fulfillOrder(data.orderId).catch(() => null);
    return { ok: true };
  });

export const adminSetAnnouncement = createServerFn({ method: "POST" })
  .validator((data: { token: string; text: string }) => ({
    token: T(data),
    text: String(data?.text ?? "").trim().slice(0, 300),
  }))
  .handler(async ({ data }): Promise<{ ok: true } | AdminFail> => {
    if (!(await guard(data.token))) return { ok: false, code: "SESSAO" };
    const { getDb: getSql } = await import("./db-app.server");
    const sql = await getSql();
    await sql.query(
      `insert into app_settings (key, value) values ('announcement', $1)
       on conflict (key) do update set value = $1, updated_at = now()`,
      [data.text],
    );
    return { ok: true };
  });
