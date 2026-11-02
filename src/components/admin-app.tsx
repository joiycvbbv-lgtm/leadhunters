import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  adminCreateKeys,
  adminLogin,
  adminOverview,
  adminReconcile,
  adminSetAnnouncement,
  adminSiteAction,
  adminSimulatePayment,
  adminUpdateKey,
  type AdminKey,
  type AdminOverview,
  type AdminPatch,
} from "@/lib/admin.functions";
import { brl } from "@/lib/plans";

const card = "rounded-2xl border border-border bg-surface shadow-card";
const field =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted/70 focus:border-primary";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary-deep px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-[0_6px_16px_-6px_rgba(29,111,224,0.6)] transition hover:brightness-105 disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-fg transition hover:border-primary hover:text-primary";
const TOKEN = "lh_admin_token";

function when(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const esc = (value: string | number) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const body = [head, ...rows].map((row) => row.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function maskKey(key: string) {
  return `LH-••••-••••-••••-${key.slice(-4)}`;
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length >= 12 && digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

function MiniBars({ title, values, labels, format }: { title: string; values: number[]; labels: string[]; format?: (n: number) => string }) {
  const peak = Math.max(1, ...values);
  return (
    <div className={`p-4 ${card}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="flex h-28 items-end gap-1">
        {values.map((value, index) => (
          <div key={labels[index]} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${labels[index]}: ${format ? format(value) : value}`}>
            <div
              className="w-full rounded-t bg-gradient-to-t from-primary to-sky-300"
              style={{ height: `${Math.max(3, Math.round((value / peak) * 80))}px`, opacity: value ? 1 : 0.25 }}
            />
            <span className="text-[9px] text-muted">{labels[index]}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Total: {format ? format(values.reduce((a, b) => a + b, 0)) : values.reduce((a, b) => a + b, 0)}</p>
    </div>
  );
}

function state(key: AdminKey) {
  if (key.status !== "ativa") return { label: "Revogada", cls: "bg-danger/10 text-danger" };
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now())
    return { label: "Vencida", cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" };
  if (key.activatedAt) return { label: "Em uso", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" };
  return { label: "Livre", cls: "bg-primary-soft text-primary-deep dark:text-primary" };
}

export function AdminApp() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [search, setSearch] = useState("");
  const [only, setOnly] = useState<"todas" | "livres" | "uso" | "revogadas" | "teste">("todas");
  const [fresh, setFresh] = useState<string[]>([]);
  const [copied, setCopied] = useState("");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [annText, setAnnText] = useState("");
  const [form, setForm] = useState({
    count: 10,
    kind: "full" as "full" | "test",
    buyer: "",
    dailyLimit: 30,
    maxDevices: 2,
    validDays: "",
    validMinutes: "5",
  });

  const load = useCallback(async (t: string) => {
    const result = await adminOverview({ data: { token: t } }).catch(() => null);
    if (result?.ok) {
      setData(result);
    } else {
      sessionStorage.removeItem(TOKEN);
      setToken("");
      setData(null);
      setLoginError("Sessão expirada. Entre de novo.");
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN);
    if (saved) {
      setToken(saved);
      void load(saved);
    }
  }, [load]);

  async function login() {
    setBusy(true);
    setLoginError("");
    try {
      const result = await adminLogin({ data: { password } });
      if (!result.ok) {
        setLoginError(
          result.code === "SEM_SENHA"
            ? "Falta definir ADMIN_PASSWORD nas variáveis de ambiente da Vercel."
            : "Senha incorreta.",
        );
        return;
      }
      sessionStorage.setItem(TOKEN, result.token);
      setToken(result.token);
      setPassword("");
      await load(result.token);
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    try {
      const result = await adminCreateKeys({
        data: {
          token,
          count: form.count,
          kind: form.kind,
          buyer: form.buyer,
          dailyLimit: form.dailyLimit,
          maxDevices: form.maxDevices,
          validDays: form.validDays ? Number(form.validDays) : null,
          validMinutes: form.kind === "test" ? Number(form.validMinutes) || 5 : null,
        },
      });
      if (result.ok) {
        setFresh(result.keys);
        await load(token);
      }
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, change: AdminPatch) {
    await adminUpdateKey({ data: { token, id, patch: change } });
    await load(token);
  }

  useEffect(() => {
    if (data) setAnnText(data.announcement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.announcement]);

  async function saveAnnouncement(text: string) {
    setBusy(true);
    await adminSetAnnouncement({ data: { token, text } }).catch(() => null);
    await load(token);
    setBusy(false);
  }

  async function simulate(orderId: string) {
    setBusy(true);
    const result = await adminSimulatePayment({ data: { token, orderId } }).catch(() => null);
    if (!result?.ok) window.alert("Não deu para simular. Isso só funciona com a chave de TESTE do AbacatePay.");
    await load(token);
    setBusy(false);
  }

  async function siteAction(slug: string, action: "suspender" | "reativar" | "excluir") {
    if (action === "excluir" && !window.confirm("Excluir esse site de vez?")) return;
    setBusy(true);
    await adminSiteAction({ data: { token, slug, action } }).catch(() => null);
    await load(token);
    setBusy(false);
  }

  async function reconcile() {
    setBusy(true);
    await adminReconcile({ data: { token } }).catch(() => null);
    await load(token);
    setBusy(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(id);
        setTimeout(() => setCopied(""), 1500);
      })
      .catch(() => undefined);
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.keys ?? []).filter((k) => {
      if (only === "livres" && (k.activatedAt || k.status !== "ativa")) return false;
      if (only === "uso" && !(k.activatedAt && k.status === "ativa")) return false;
      if (only === "revogadas" && k.status === "ativa") return false;
      if (only === "teste" && k.kind !== "test") return false;
      return !q || `${k.hint} ${k.buyer} ${k.note}`.toLowerCase().includes(q);
    });
  }, [data, search, only]);

  if (!token || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form
          className={`w-full max-w-sm space-y-3 p-6 ${card}`}
          onSubmit={(event) => {
            event.preventDefault();
            void login();
          }}
        >
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-b from-primary to-primary-deep text-primary-fg">
              <ShieldCheck className="size-5" />
            </div>
            <h1 className="font-display text-xl font-semibold">Admin</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha do admin"
            className={field}
            autoComplete="current-password"
          />
          {loginError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{loginError}</p>}
          <button type="submit" disabled={busy} className={`w-full ${btnPrimary}`}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Entrar
          </button>
        </form>
      </main>
    );
  }

  const s = data.stats;
  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-5 px-4 pb-16 pt-5 sm:px-6">
      <header className={`flex flex-wrap items-center justify-between gap-3 p-4 ${card}`}>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <KeyRound className="size-5 text-primary" /> Admin LeadHunter
        </h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load(token)} className={btnGhost}>
            <RefreshCw className="size-3.5" /> Atualizar
          </button>
          <button type="button" onClick={reconcile} disabled={busy} className={btnGhost}>
            <Check className="size-3.5" /> Conferir pagamentos
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(TOKEN);
              setToken("");
              setData(null);
            }}
            className={btnGhost}
          >
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            ["Keys", s.totalKeys],
            ["Ativas", s.activeKeys],
            ["Em uso", s.inUse],
            ["Buscas hoje", s.searchesToday],
            ["Vendas (Pix)", s.paidOrders],
            ["Receita", brl(s.revenueCents)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className={`p-3.5 ${card}`}>
            <p className="text-xs text-muted">{label}</p>
            <p className="font-display text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <MiniBars
          title="Buscas por dia (14 dias)"
          values={data.daily.map((d) => d.searches)}
          labels={data.daily.map((d) => d.day.slice(8))}
        />
        <MiniBars
          title="Vendas por dia (14 dias)"
          values={data.daily.map((d) => d.sales)}
          labels={data.daily.map((d) => d.day.slice(8))}
        />
        <MiniBars
          title="Receita por dia (14 dias)"
          values={data.daily.map((d) => d.revenueCents)}
          labels={data.daily.map((d) => d.day.slice(8))}
          format={brl}
        />
      </section>

      <section className={`p-4 ${card}`}>
        <h2 className="mb-1 font-semibold">Aviso para todos os clientes</h2>
        <p className="mb-3 text-xs text-muted">Aparece como uma faixa no painel de quem estiver logado. Deixe vazio para tirar.</p>
        <textarea
          value={annText}
          onChange={(event) => setAnnText(event.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Ex.: Novidade! Agora dá para gerar proposta em PDF."
          className={field}
        />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => void saveAnnouncement(annText)} disabled={busy} className={btnPrimary}>
            Publicar aviso
          </button>
          <button
            type="button"
            onClick={() => {
              setAnnText("");
              void saveAnnouncement("");
            }}
            disabled={busy}
            className={btnGhost}
          >
            Tirar aviso
          </button>
        </div>
      </section>

      {data.sites.length > 0 && (
        <section className={`p-4 ${card}`}>
          <h2 className="mb-3 font-semibold">Sites publicados ({data.sites.length})</h2>
          <div className="divide-y divide-border text-sm">
            {data.sites.map((site) => (
              <div key={site.slug} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {site.name} <span className="text-xs text-muted">· {site.kind === "final" ? "final" : "prévia"}</span>
                    {site.status !== "ativo" && <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">suspenso</span>}
                  </p>
                  <p className="text-xs text-muted">
                    de {site.owner} · {site.views} visitas · {when(site.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <a className={btnGhost} href={`/s/${site.slug}`} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                  {site.status === "ativo" ? (
                    <button type="button" className={`${btnGhost} text-danger`} onClick={() => void siteAction(site.slug, "suspender")}>
                      Suspender
                    </button>
                  ) : (
                    <button type="button" className={btnGhost} onClick={() => void siteAction(site.slug, "reativar")}>
                      Reativar
                    </button>
                  )}
                  <button type="button" className={`${btnGhost} text-danger`} onClick={() => void siteAction(site.slug, "excluir")}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.trials.length > 0 && (
        <section className={`p-4 ${card}`}>
          <h2 className="mb-3 font-semibold">Testes grátis ({data.trials.length})</h2>
          <div className="divide-y divide-border text-sm">
            {data.trials.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{t.name || "Sem nome"}</p>
                  <p className="text-xs text-muted">
                    {t.whatsapp} · {when(t.createdAt)}
                  </p>
                </div>
                <a
                  className={btnGhost}
                  target="_blank"
                  rel="noreferrer"
                  href={waLink(
                    t.whatsapp,
                    `Oi${t.name ? ` ${t.name.split(" ")[0]}` : ""}! Vi que você testou o LeadHunter. Ficou com alguma dúvida? Para liberar o acesso completo é só escolher um plano: ${window.location.origin}/comprar`,
                  )}
                >
                  <MessageCircle className="size-3.5" /> Chamar no WhatsApp
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.expiring.length > 0 && (
        <section className={`p-4 ${card}`}>
          <h2 className="mb-3 font-semibold">Vencendo em 7 dias ({data.expiring.length})</h2>
          <div className="divide-y divide-border text-sm">
            {data.expiring.map((k) => (
              <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{k.buyer || "Sem nome"}</p>
                  <p className="font-mono text-xs text-muted">
                    {maskKey(k.hint)} · vence {when(k.expiresAt)}
                  </p>
                </div>
                {k.whatsapp ? (
                  <a
                    className={btnGhost}
                    target="_blank"
                    rel="noreferrer"
                    href={waLink(
                      k.whatsapp,
                      `Oi${k.buyer ? ` ${k.buyer.split(" ")[0]}` : ""}! Sua key do LeadHunter vence em ${new Date(k.expiresAt).toLocaleDateString("pt-BR")}. Para renovar é só pagar pelo link: ${window.location.origin}/comprar`,
                    )}
                  >
                    <MessageCircle className="size-3.5" /> Avisar no WhatsApp
                  </a>
                ) : (
                  <span className="text-xs text-muted">Sem WhatsApp salvo (key criada no admin)</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={`p-4 ${card}`}>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <PlusCircle className="size-4 text-primary" /> Gerar keys
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <label className="text-xs font-semibold">
            Quantidade
            <input type="number" min={1} max={100} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} className={`mt-1 ${field}`} />
          </label>
          <label className="text-xs font-semibold">
            Tipo
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "full" | "test" })} className={`mt-1 ${field}`}>
              <option value="full">Normal</option>
              <option value="test">Teste</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Buscas por dia
            <input type="number" min={1} value={form.dailyLimit} onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) })} className={`mt-1 ${field}`} />
          </label>
          {form.kind === "full" ? (
            <>
              <label className="text-xs font-semibold">
                Aparelhos
                <input type="number" min={1} max={10} value={form.maxDevices} onChange={(e) => setForm({ ...form, maxDevices: Number(e.target.value) })} className={`mt-1 ${field}`} />
              </label>
              <label className="text-xs font-semibold">
                Validade (dias)
                <input type="number" min={1} placeholder="vazio = sem fim" value={form.validDays} onChange={(e) => setForm({ ...form, validDays: e.target.value })} className={`mt-1 ${field}`} />
              </label>
            </>
          ) : (
            <label className="text-xs font-semibold">
              Minutos de teste
              <input type="number" min={1} value={form.validMinutes} onChange={(e) => setForm({ ...form, validMinutes: e.target.value })} className={`mt-1 ${field}`} />
            </label>
          )}
          <label className="text-xs font-semibold">
            Comprador (opcional)
            <input value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} className={`mt-1 ${field}`} />
          </label>
        </div>
        <button type="button" onClick={create} disabled={busy} className={`mt-3 ${btnPrimary}`}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />} Gerar
        </button>
        {fresh.length > 0 && (
          <div className="mt-4 rounded-xl border border-primary/40 bg-primary-soft p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{fresh.length} keys novas</p>
              <button type="button" onClick={() => copy(fresh.join("\n"), "fresh")} className={btnGhost}>
                {copied === "fresh" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copiar todas
              </button>
            </div>
            <pre className="max-h-40 overflow-auto font-mono text-xs">{fresh.join("\n")}</pre>
          </div>
        )}
      </section>

      <section className={`p-4 ${card}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 font-semibold">Keys ({rows.length})</h2>
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              downloadCsv(
                "keys.csv",
                ["Key", "Comprador", "Estado", "Aparelhos", "Buscas hoje", "Vence"],
                rows.map((k) => [k.key ?? k.hint, k.buyer, state(k).label, `${k.devices}/${k.maxDevices}`, `${k.usedToday}/${k.dailyLimit}`, k.expiresAt ?? ""]),
              )
            }
          >
            <Download className="size-3.5" /> Exportar
          </button>
          {(["todas", "livres", "uso", "revogadas", "teste"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setOnly(f)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${only === f ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted"}`}
            >
              {f}
            </button>
          ))}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar key ou comprador" className={`ml-auto max-w-56 ${field}`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-3">Key</th>
                <th className="pr-3">Estado</th>
                <th className="pr-3">Comprador</th>
                <th className="pr-3">Aparelhos</th>
                <th className="pr-3">Buscas hoje</th>
                <th className="pr-3">Vence</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((k) => {
                const st = state(k);
                return (
                  <tr key={k.id}>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {k.key && (
                        <button
                          type="button"
                          aria-label={revealed.has(k.id) ? "Esconder key" : "Ver key"}
                          onClick={() =>
                            setRevealed((prev) => {
                              const next = new Set(prev);
                              if (next.has(k.id)) next.delete(k.id);
                              else next.add(k.id);
                              return next;
                            })
                          }
                          className="mr-1.5 align-middle text-muted hover:text-primary"
                        >
                          {revealed.has(k.id) ? <EyeOff className="inline size-3.5" /> : <Eye className="inline size-3.5" />}
                        </button>
                      )}
                      {k.key && !revealed.has(k.id) ? maskKey(k.key) : k.hint}
                      {k.kind === "test" && <span className="ml-1 rounded bg-primary-soft px-1 text-[10px] font-bold text-primary">TESTE</span>}
                    </td>
                    <td className="pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="pr-3">
                      <input
                        defaultValue={k.buyer}
                        placeholder="—"
                        onBlur={(e) => e.target.value !== k.buyer && void patch(k.id, { buyer: e.target.value })}
                        className="w-32 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-border focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td className="pr-3">
                      {k.devices}/{k.maxDevices}
                    </td>
                    <td className="pr-3">
                      {k.usedToday}/{k.dailyLimit}
                    </td>
                    <td className="pr-3 text-xs">{k.activatedAt ? when(k.expiresAt) : k.expiresAt ? when(k.expiresAt) : "no 1º login"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {k.key && (
                          <button type="button" onClick={() => copy(k.key!, `k${k.id}`)} className={btnGhost}>
                            {copied === `k${k.id}` ? <Check className="size-3" /> : <Copy className="size-3" />} Key
                          </button>
                        )}
                        {k.status === "ativa" ? (
                          <button type="button" onClick={() => void patch(k.id, { status: "revogada" })} className={`${btnGhost} text-danger`}>
                            <Ban className="size-3" /> Revogar
                          </button>
                        ) : (
                          <button type="button" onClick={() => void patch(k.id, { status: "ativa" })} className={btnGhost}>
                            Reativar
                          </button>
                        )}
                        <button type="button" onClick={() => void patch(k.id, { extendDays: 30 })} className={btnGhost}>
                          +30d
                        </button>
                        <button type="button" onClick={() => void patch(k.id, { resetDevices: true })} className={btnGhost}>
                          <RotateCcw className="size-3" /> Aparelhos
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhuma key com esse filtro.</p>}
        </div>
        <p className="mt-3 text-xs text-muted">
          As 50 keys antigas guardam só o código criptografado, por isso aparecem como “LH-…”. Keys novas mostram o texto
          completo.
        </p>
      </section>

      <section className={`p-4 ${card}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Pedidos Pix</h2>
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              downloadCsv(
                "pedidos.csv",
                ["Data", "Nome", "E-mail", "WhatsApp", "Plano", "Valor", "Status"],
                data.orders.map((o) => [when(o.createdAt), o.buyerName, o.buyerEmail, o.buyerWhatsapp, o.plan, brl(o.amountCents), o.status]),
              )
            }
          >
            <Download className="size-3.5" /> Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-3">Data</th>
                <th className="pr-3">Cliente</th>
                <th className="pr-3">Plano</th>
                <th className="pr-3">Valor</th>
                <th className="pr-3">Status</th>
                <th>Key</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 pr-3 text-xs">{when(o.createdAt)}</td>
                  <td className="pr-3">
                    {o.buyerName}
                    <span className="block text-xs text-muted">{o.buyerWhatsapp}</span>
                  </td>
                  <td className="pr-3">{o.plan}</td>
                  <td className="pr-3">{brl(o.amountCents)}</td>
                  <td className="pr-3">{o.status}</td>
                  <td className="font-mono text-xs">{o.keyHint ?? "—"}</td>
                  <td>
                    {o.status === "pendente" && (
                      <button type="button" onClick={() => void simulate(o.id)} disabled={busy} className={btnGhost}>
                        Simular pagamento (teste)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.orders.length === 0 && <p className="py-6 text-center text-sm text-muted">Nenhum pedido ainda.</p>}
        </div>
      </section>
    </div>
  );
}
