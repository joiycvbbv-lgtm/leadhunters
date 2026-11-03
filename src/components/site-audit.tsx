import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, X } from "lucide-react";
import { auditSite, type AuditResult } from "@/lib/audit.functions";

const card = "rounded-2xl border border-border bg-surface shadow-card";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary";
const ACCESS_ERRORS = ["KEY_INVALIDA", "KEY_REVOGADA", "KEY_EXPIRADA", "APARELHOS", "NAO_VINCULADO"];

export function SiteAuditModal({
  name,
  phone,
  url,
  accessKey,
  deviceId,
  sellerName,
  onClose,
  onAccessError,
  notify,
}: {
  name: string;
  phone: string;
  url: string;
  accessKey: string;
  deviceId: string;
  sellerName: string;
  onClose: () => void;
  onAccessError: (code: string) => void;
  notify: (text: string) => void;
}) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    auditSite({ data: { key: accessKey, deviceId, url } })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok && ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
        else setResult(res);
      })
      .catch(() => !cancelled && setResult({ ok: false, error: "Não consegui analisar agora. Tente de novo." }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issues = result?.ok ? result.issues.slice(0, 3) : [];
  const message = result?.ok
    ? issues.length
      ? `Oi, tudo bem? Aqui é ${sellerName.trim() || "Seu nome"}. Dei uma olhada no site da ${name} e vi que ${issues[0]}${issues[1] ? `, e também que ${issues[1]}` : ""}. Isso pode estar fazendo vocês perderem clientes que chegam pelo celular ou pelo Google.\n\nTrabalho melhorando sites assim e posso te mostrar uma prévia de como ficaria, sem compromisso. Posso te mandar?`
      : `Oi, tudo bem? Aqui é ${sellerName.trim() || "Seu nome"}. Dei uma olhada no site da ${name} e ele está bem cuidado, parabéns! Se quiser, posso ajudar com outras coisas, como anúncios ou o perfil no Google. Posso te explicar?`
    : "";
  const digits = phone.replace(/\D/g, "");
  const wa = digits ? `https://wa.me/${digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`}?text=${encodeURIComponent(message)}` : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-fg/40 p-4 backdrop-blur-sm sm:items-center">
      <div className={`max-h-[88vh] w-full max-w-lg overflow-y-auto p-5 ${card}`}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold">Análise do site</h2>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline">
              <ExternalLink className="size-3 shrink-0" /> {url.replace(/^https?:\/\//, "")}
            </a>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} className="text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>

        {!result && (
          <p className="flex items-center gap-2 py-6 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Abrindo o site e conferindo…
          </p>
        )}
        {result && !result.ok && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{result.error}</p>}
        {result?.ok && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex size-20 items-center justify-center rounded-full border-4 font-display text-2xl font-bold ${
                  result.score >= 80 ? "border-emerald-400 text-emerald-600" : result.score >= 50 ? "border-amber-400 text-amber-600" : "border-red-400 text-red-600"
                }`}
              >
                {result.score}
              </div>
              <p className="text-sm text-muted">
                {result.score >= 80
                  ? "Site em bom estado. Pouca chance de venda de site novo."
                  : result.score >= 50
                    ? "Site mediano, com pontos para melhorar. Boa oportunidade."
                    : "Site fraco. Ótima oportunidade de venda."}
              </p>
            </div>
            <ul className="space-y-1.5 text-sm">
              {result.items.map((item) => (
                <li key={item.label} className="flex items-start gap-2">
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${item.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {item.ok ? "✓" : "!"}
                  </span>
                  <span>
                    {item.label}
                    {item.detail ? <span className="text-muted"> · {item.detail}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Análise rápida e automática, feita a partir do nosso servidor. A velocidade pode variar, então confira o site você
              mesmo antes de falar com o cliente.
            </p>
            <div>
              <p className="mb-1 text-sm font-semibold">Mensagem de abordagem</p>
              <p className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm">{message}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() =>
                    navigator.clipboard
                      ?.writeText(message)
                      .then(() => {
                        setCopied(true);
                        notify("Mensagem copiada");
                        setTimeout(() => setCopied(false), 1500);
                      })
                      .catch(() => undefined)
                  }
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copiar
                </button>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-3 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:brightness-105">
                    Abrir no WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
