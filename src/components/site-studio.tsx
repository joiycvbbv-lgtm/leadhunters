import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  ImagePlus,
  Loader2,
  Monitor,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteSite,
  getSiteForLead,
  listMySites,
  placeDetails,
  publishSite,
  setSiteMode,
  type MySite,
} from "@/lib/sites.functions";
import type { SavedLead } from "@/lib/storage";
import {
  DESIGNS,
  KIND_LABELS,
  PRESETS,
  buildSite,
  detectKind,
  finalizeHosted,
  slugify,
  type DesignId,
  type Kind,
  type SiteData,
  type SiteItem,
} from "@/lib/site-builder";

const card = "rounded-2xl border border-border bg-surface shadow-card";
const field =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-fg outline-none placeholder:text-muted/70 focus:border-primary";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary-deep font-semibold text-primary-fg shadow-[0_6px_16px_-6px_rgba(29,111,224,0.6)] transition hover:brightness-105 disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary disabled:opacity-50";
const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "border-primary bg-primary text-primary-fg shadow-sm"
      : "border-border bg-surface text-muted hover:border-primary/50 hover:text-fg"
  }`;

const ACCESS_ERRORS = ["KEY_INVALIDA", "KEY_REVOGADA", "KEY_EXPIRADA", "APARELHOS", "NAO_VINCULADO"];
const PIX_KEY = "lh_pix_key";

/* ---------- utilidades ---------- */

function parseItems(text: string): SiteItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return { name: parts[0] ?? "", desc: parts[1] ?? "", price: parts[2] ?? "" };
    })
    .filter((item) => item.name);
}

const itemsToText = (items: SiteItem[]) => items.map((i) => [i.name, i.desc, i.price].join(" | ").replace(/( \| )+$/, "")).join("\n");
const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);

const EXAMPLES: Partial<Record<Kind, string>> = {
  burger: "X-Burger | Pão, blend 160g, queijo, alface e tomate | R$ 28\nX-Bacon | Blend 160g, queijo e bacon crocante | R$ 33\nBatata frita | Porção para dividir | R$ 18",
  restaurante: "Prato do dia | Acompanha arroz, feijão e salada | R$ 32\nExecutivo | Prato completo com bebida | R$ 38",
  cafe: "Pão na chapa | Com manteiga | R$ 8\nCafé coado | Xícara | R$ 6\nBolo do dia | Fatia | R$ 10",
  barbearia: "Corte | Na tesoura ou máquina | R$ 45\nBarba | Com toalha quente | R$ 30\nCorte + barba | Combo completo | R$ 70",
  salao: "Corte feminino | Com finalização | R$ 70\nManicure | Mãos | R$ 35\nEscova | Cabelo curto e médio | R$ 45",
  clinica: "Consulta | Avaliação inicial | \nRetorno | Acompanhamento | ",
  oficina: "Revisão completa | Itens essenciais de segurança | A combinar\nTroca de óleo | Com filtro | A combinar",
  fitness: "Musculação | Treino orientado | \nAula experimental | Conheça o espaço | ",
  loja: "Linha nova | Chegou na loja | \nPromoções | Ofertas da semana | ",
  servicos: "Orçamento | Sem compromisso | Grátis\nServiço principal | Descreva aqui | A combinar",
  generico: "Serviço principal | Descreva aqui | A combinar",
};

async function compress(file: File, maxSide: number, quality: number, type: "image/jpeg" | "image/png"): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  if (type === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL(type, quality);
}

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("55") && d.length > 11 ? d : `55${d}`;
}

/* ---------- Estúdio ---------- */

type Props = {
  lead: SavedLead;
  accessKey: string;
  deviceId: string;
  sellerName: string;
  isTest: boolean;
  onClose: () => void;
  onUsage: (used: number, limit: number) => void;
  onAccessError: (code: string) => void;
  notify: (text: string) => void;
  onSent: (id: string, text: string) => void;
  onProposal: (lead: SavedLead) => void;
  onWon: (id: string) => void;
};

function initialSite(lead: SavedLead): SiteData {
  const kind = detectKind(lead.category, lead.name);
  const preset = PRESETS[kind];
  return {
    name: lead.name,
    tagline: "",
    phone: lead.phone,
    address: lead.address,
    city: lead.city,
    category: lead.category === "Manual" || lead.category === "Importado" ? "" : lead.category,
    rating: lead.rating,
    reviews: lead.reviews,
    showRating: true,
    mapsUrl: lead.mapsUrl ?? "",
    instagram: "",
    hours: [],
    about: "",
    highlights: [],
    items: [],
    photos: [],
    logo: "",
    kind,
    design: preset.design,
    color: preset.color,
  };
}

export function SiteStudio({
  lead,
  accessKey,
  deviceId,
  sellerName,
  isTest,
  onClose,
  onUsage,
  onAccessError,
  notify,
  onSent,
  onProposal,
  onWon,
}: Props) {
  const [site, setSite] = useState<SiteData>(() => initialSite(lead));
  const [hoursText, setHoursText] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [hlText, setHlText] = useState("");
  const [slug, setSlug] = useState("");
  const [mode, setMode] = useState<"previa" | "final">("previa");
  const [indexable, setIndexable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pane, setPane] = useState<"editar" | "previa">("editar");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [pixKey, setPixKey] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    try {
      setPixKey(localStorage.getItem(PIX_KEY) || "");
    } catch {
      /* sem armazenamento */
    }
    let cancelled = false;
    getSiteForLead({ data: { key: accessKey, deviceId, leadRef: lead.id } })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
        } else if (res.found) {
          setSite({ ...initialSite(lead), ...res.site });
          setHoursText(res.site.hours.join("\n"));
          setItemsText(itemsToText(res.site.items));
          setHlText(res.site.highlights.join("\n"));
          setSlug(res.slug);
          setMode(res.kind);
          setIndexable(res.indexable);
        }
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data: SiteData = useMemo(
    () => ({ ...site, hours: lines(hoursText).slice(0, 7), items: parseItems(itemsText), highlights: lines(hlText).slice(0, 6) }),
    [site, hoursText, itemsText, hlText],
  );
  const deferred = useDeferredValue(data);
  const previewHtml = useMemo(() => finalizeHosted(buildSite(deferred), mode, indexable), [deferred, mode, indexable]);
  const link = slug ? `${window.location.origin}/s/${slug}` : "";
  const photosSize = site.photos.reduce((sum, p) => sum + p.length, 0) + site.logo.length;
  const tooHeavy = photosSize > 3_000_000;

  function patch(change: Partial<SiteData>) {
    setSite((current) => ({ ...current, ...change }));
  }

  function copy(text: string, id: string, message: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(id);
        notify(message);
        setTimeout(() => setCopied(""), 1600);
      })
      .catch(() => notify("Não consegui copiar"));
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy("fotos");
    setError("");
    const next = [...site.photos];
    for (const file of Array.from(files)) {
      if (next.length >= 8) break;
      try {
        next.push(await compress(file, 1280, 0.7, "image/jpeg"));
      } catch {
        setError("Não consegui ler uma das fotos. Use arquivos JPG, PNG ou WEBP.");
      }
    }
    patch({ photos: next });
    setBusy("");
  }

  async function addLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      patch({ logo: await compress(file, 480, 0.9, "image/png") });
    } catch {
      setError("Não consegui ler o logo. Use JPG, PNG ou WEBP.");
    }
  }

  function movePhoto(index: number, to: number) {
    const next = [...site.photos];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    patch({ photos: next });
  }

  async function fetchHours() {
    setBusy("horarios");
    setError("");
    try {
      const res = await placeDetails({ data: { key: accessKey, deviceId, placeId: lead.id } });
      if (!res.ok) {
        if (ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
        else if (res.error === "LIMITE_DIARIO") setError("Você usou todas as buscas de hoje. Digite os horários na mão.");
        else setError(res.error);
        return;
      }
      onUsage(res.usage.used, res.usage.limit);
      setHoursText(res.place.hours.join("\n"));
      patch({
        phone: site.phone || res.place.phone,
        address: res.place.address || site.address,
        city: res.place.city || site.city,
        category: res.place.category || site.category,
        kind: detectKind(res.place.category, site.name),
      });
      notify("Horários trazidos. Confira com o cliente.");
    } catch {
      setError("Não consegui consultar agora.");
    } finally {
      setBusy("");
    }
  }

  async function publish(kind: "previa" | "final", index = indexable) {
    if (isTest) {
      setError("A key de teste não publica sites. Escolha um plano para publicar.");
      return;
    }
    if (data.name.trim().length < 2) {
      setError("Preencha o nome da empresa.");
      return;
    }
    setBusy("publicar");
    setError("");
    try {
      const res = await publishSite({
        data: { key: accessKey, deviceId, slug, leadRef: lead.id, site: data, kind, indexable: index },
      });
      if (!res.ok) {
        if (ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
        else setError(res.error);
        return;
      }
      setSlug(res.slug);
      setMode(res.kind);
      setIndexable(kind === "final" && index);
      notify(kind === "final" ? "Versão final publicada" : slug ? "Prévia atualizada" : "Prévia publicada");
    } catch {
      setError("Não consegui publicar agora. Tente de novo.");
    } finally {
      setBusy("");
    }
  }

  const name = data.name.trim() || lead.name;
  const seller = sellerName.trim() || "Seu nome";
  const nice = data.rating >= 4 && data.reviews >= 10;
  const first = `Oi, tudo bem? Aqui é ${seller}. Vi a ${name} no Google${nice ? ` (nota ${data.rating.toFixed(1).replace(".", ",")} com ${data.reviews} avaliações, parabéns!)` : ""} e percebi que vocês ainda não têm um site próprio.\n\nMontei uma prévia de como poderia ficar, dá uma olhada: ${link || "[publique a prévia para gerar o link]"}\n\nSe gostar, eu ajusto com as fotos e informações de vocês. Posso te explicar como funciona e os valores?`;
  const followA = `Oi! Conseguiu ver a prévia do site da ${name}? ${link}\nQualquer ajuste que quiser, é só me falar.`;
  const followB = `Oi! Vou deixar a prévia da ${name} no ar por mais alguns dias: ${link}\nSe fizer sentido para vocês, me chama que eu finalizo. Se não, tudo bem, obrigado pela atenção!`;
  const [message, setMessage] = useState("");
  useEffect(() => setMessage(first), [first]);
  const welcome = `Combinado! Para finalizar o site da ${name}, preciso de:\n\n1) Fotos do local e dos produtos/serviços (pode mandar aqui mesmo, as melhores que tiver)\n2) O logo, se tiver\n3) ${PRESETS[data.kind].itemsTitle === "Cardápio" ? "O cardápio com os preços" : "A lista de serviços com os valores"}\n4) Horários de funcionamento e endereço corretos\n5) O link do Instagram\n6) Se já tem domínio (ex.: ${slugify(name)}.com.br) ou se prefere que eu cuide disso\n\nAssim que eu receber, ajusto tudo e te mando a versão final.`;
  const payment = `Para começar, o valor é ${lead.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.\nChave Pix: ${pixKey || "[SUA CHAVE PIX]"}\n\nAssim que confirmar o pagamento, já ajusto o site e te envio a versão final.`;
  const delivery = `O site da ${name} está pronto! ${link}\n\nConfere tudo com calma e me avisa se quiser mudar algo. Obrigado pela confiança!`;
  const finalHtml = finalizeHosted(buildSite(data), "final", true);
  const whatsapp = lead.phone ? `https://wa.me/${waDigits(lead.phone)}?text=` : "";
  const dropdown = (id: string, label: string, text: string) => (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className="mb-1 text-sm font-semibold">{label}</p>
      <p className="whitespace-pre-wrap text-xs text-muted">{text}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => copy(text, id, "Mensagem copiada")} className={btnGhost}>
          {copied === id ? <Check className="size-4" /> : <Copy className="size-4" />} Copiar
        </button>
        {whatsapp && (
          <a href={`${whatsapp}${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className={btnGhost}>
            Abrir no WhatsApp
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <p className="flex items-center gap-2 font-display text-lg font-semibold">
          <Globe className="size-5 text-primary" /> Site de {lead.name}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 lg:hidden">
            <button type="button" onClick={() => setPane("editar")} className={chip(pane === "editar")}>
              Editar
            </button>
            <button type="button" onClick={() => setPane("previa")} className={chip(pane === "previa")}>
              Prévia
            </button>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} className="p-2 text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center justify-center gap-2 p-10 text-muted">
          <Loader2 className="size-4 animate-spin" /> Carregando…
        </p>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-2">
          <div className={`space-y-5 ${pane === "previa" ? "hidden lg:block" : ""}`}>
            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

            <section className={`space-y-3 p-4 ${card}`}>
              <h3 className="font-semibold">1. Dados da empresa</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Nome</span>
                  <input value={site.name} onChange={(e) => patch({ name: e.target.value })} className={field} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">WhatsApp</span>
                  <input value={site.phone} onChange={(e) => patch({ phone: e.target.value })} inputMode="tel" className={field} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-semibold">Endereço</span>
                  <input value={site.address} onChange={(e) => patch({ address: e.target.value })} className={field} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Cidade</span>
                  <input value={site.city} onChange={(e) => patch({ city: e.target.value })} className={field} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Instagram (link)</span>
                  <input value={site.instagram} onChange={(e) => patch({ instagram: e.target.value })} placeholder="https://instagram.com/..." className={field} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 flex items-center justify-between gap-2 font-semibold">
                    Horários (um por linha)
                    <button type="button" onClick={() => void fetchHours()} disabled={busy === "horarios"} className="text-xs font-semibold text-primary hover:underline">
                      {busy === "horarios" ? "Buscando…" : "Trazer do Google (usa 1 busca)"}
                    </button>
                  </span>
                  <textarea value={hoursText} onChange={(e) => setHoursText(e.target.value)} rows={4} placeholder={"segunda-feira: 08:00 – 18:00\nterça-feira: 08:00 – 18:00"} className={field} />
                  <span className="mt-1 block text-xs text-muted">Confira sempre os horários com o cliente antes de enviar.</span>
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-semibold">Frase de destaque (opcional)</span>
                  <input value={site.tagline} onChange={(e) => patch({ tagline: e.target.value })} placeholder="Só escreva se o cliente tiver uma frase dele. Sem frase, o site fica mais limpo." className={field} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-semibold">Quem somos (opcional)</span>
                  <textarea value={site.about} onChange={(e) => patch({ about: e.target.value })} rows={3} placeholder="Escreva com as palavras do dono. Se ficar vazio, o site usa uma frase simples com os dados reais." className={field} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-semibold">Tipo de negócio</span>
                  <select
                    value={site.kind}
                    onChange={(e) => {
                      const kind = e.target.value as Kind;
                      patch({ kind, design: PRESETS[kind].design, color: PRESETS[kind].color });
                    }}
                    className={field}
                  >
                    {(Object.keys(KIND_LABELS) as Kind[]).map((item) => (
                      <option key={item} value={item}>
                        {KIND_LABELS[item]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className={`space-y-3 p-4 ${card}`}>
              <h3 className="font-semibold">2. {PRESETS[site.kind].itemsTitle} e diferenciais</h3>
              <label className="block text-sm">
                <span className="mb-1 flex items-center justify-between gap-2 font-semibold">
                  Um item por linha: nome | descrição | preço
                  <button type="button" onClick={() => setItemsText(EXAMPLES[site.kind] ?? "")} className="text-xs font-semibold text-primary hover:underline">
                    Inserir exemplo
                  </button>
                </span>
                <textarea value={itemsText} onChange={(e) => setItemsText(e.target.value)} rows={6} placeholder="X-Burger | Pão, blend 160g, queijo | R$ 28" className={`${field} font-mono text-xs`} />
                <span className="mt-1 block text-xs text-muted">Use só o que o cliente confirmar. Sem itens, essa seção não aparece no site.</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">Diferenciais (um por linha, até 6)</span>
                <textarea value={hlText} onChange={(e) => setHlText(e.target.value)} rows={3} placeholder="Carne moída na hora" className={field} />
              </label>
            </section>

            <section className={`space-y-3 p-4 ${card}`}>
              <h3 className="font-semibold">3. Fotos do cliente</h3>
              <p className="text-xs text-muted">
                Use fotos que o próprio dono enviar, ou suas, com autorização dele. Fotos tiradas do Google Maps pertencem a quem
                as postou e não devem ser copiadas para o site. Até 8 fotos; a primeira vira a capa.
              </p>
              <div className="flex flex-wrap gap-2">
                <label className={`${btnGhost} cursor-pointer`}>
                  {busy === "fotos" ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Adicionar fotos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
                </label>
                <label className={`${btnGhost} cursor-pointer`}>
                  <ImagePlus className="size-4" /> {site.logo ? "Trocar logo" : "Adicionar logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { void addLogo(e.target.files); e.target.value = ""; }} />
                </label>
                {whatsapp && (
                  <a
                    className={btnGhost}
                    target="_blank"
                    rel="noreferrer"
                    href={`${whatsapp}${encodeURIComponent(`Oi! Aqui é ${seller}. Para eu deixar o site da ${name} com a cara de vocês, pode me mandar algumas fotos do local, dos produtos ou serviços e o logo, se tiver?`)}`}
                  >
                    Pedir fotos pelo WhatsApp
                  </a>
                )}
                {site.mapsUrl && (
                  <a className={btnGhost} href={site.mapsUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Ver o lugar no Maps
                  </a>
                )}
              </div>
              {(site.photos.length > 0 || site.logo) && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {site.logo && (
                    <div className="relative rounded-xl border border-border bg-white p-2">
                      <img src={site.logo} alt="Logo" className="h-20 w-full object-contain" />
                      <button type="button" aria-label="Remover logo" onClick={() => patch({ logo: "" })} className="absolute right-1 top-1 rounded-full bg-fg/80 p-1 text-bg">
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                  {site.photos.map((photo, index) => (
                    <div key={`${index}-${photo.length}`} className="relative overflow-hidden rounded-xl border border-border">
                      <img src={photo} alt={`Foto ${index + 1}`} className="h-24 w-full object-cover" />
                      {index === 0 && <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-fg">Capa</span>}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-fg/70 px-1 py-0.5 text-[11px] text-bg">
                        <button type="button" disabled={index === 0} onClick={() => movePhoto(index, 0)} className="font-semibold disabled:opacity-40">
                          Capa
                        </button>
                        <button type="button" onClick={() => patch({ photos: site.photos.filter((_, i) => i !== index) })} aria-label="Remover foto">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tooHeavy && <p className="text-xs font-medium text-danger">As fotos estão pesadas. Remova algumas para conseguir publicar.</p>}
            </section>

            <section className={`space-y-3 p-4 ${card}`}>
              <h3 className="font-semibold">4. Visual</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {DESIGNS.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => patch({ design: design.id as DesignId })}
                    className={`rounded-xl border p-3 text-left transition ${site.design === design.id ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary/50"}`}
                  >
                    <p className="text-sm font-semibold">{design.label}</p>
                    <p className="text-xs text-muted">{design.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <span className="font-semibold">Cor principal</span>
                  <input type="color" value={site.color} onChange={(e) => patch({ color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface-2 p-1" />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={site.showRating} onChange={(e) => patch({ showRating: e.target.checked })} className="size-4 accent-[var(--color-primary)]" />
                  Mostrar a nota do Google
                </label>
              </div>
            </section>

            <section className={`space-y-3 p-4 ${card}`}>
              <h3 className="font-semibold">5. Publicar e enviar</h3>
              <button type="button" onClick={() => void publish(mode)} disabled={busy === "publicar" || tooHeavy} className={`h-12 w-full ${btnPrimary}`}>
                {busy === "publicar" ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
                {slug ? "Atualizar o site publicado" : "Publicar prévia e gerar o link"}
              </button>
              {isTest && <p className="text-xs text-danger">A key de teste não publica sites.</p>}
              {link && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary-soft p-3">
                    <code className="min-w-0 flex-1 break-all text-xs">{link}</code>
                    <button type="button" aria-label="Copiar link" onClick={() => copy(link, "link", "Link copiado")} className="rounded-lg bg-surface p-2 text-primary">
                      {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                    <a href={link} target="_blank" rel="noreferrer" aria-label="Abrir" className="rounded-lg bg-surface p-2 text-primary">
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                  <p className="text-xs text-muted">
                    {mode === "previa"
                      ? "Prévia no ar por 30 dias, com um aviso de demonstração e fora do Google."
                      : "Versão final no ar, sem o aviso de demonstração."}
                  </p>
                  <div>
                    <p className="mb-1 text-sm font-semibold">Mensagem de abordagem</p>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={7} className={`${field} text-sm`} />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => copy(message, "msg", "Mensagem copiada")} className={btnGhost}>
                        {copied === "msg" ? <Check className="size-4" /> : <Copy className="size-4" />} Copiar
                      </button>
                      {whatsapp && (
                        <a
                          href={`${whatsapp}${encodeURIComponent(message)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => onSent(lead.id, "Prévia do site enviada")}
                          className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-3 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:brightness-105"
                        >
                          Enviar no WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                  <details className="rounded-xl bg-surface-2 p-3">
                    <summary className="cursor-pointer text-sm font-semibold">Mensagens de retorno (2 e 5 dias depois)</summary>
                    <div className="mt-3 space-y-3">
                      {dropdown("f1", "Retorno leve", followA)}
                      {dropdown("f2", "Última mensagem", followB)}
                    </div>
                  </details>
                </div>
              )}
            </section>

            <section className={`space-y-3 p-4 ${card}`}>
              <h3 className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-5 text-primary" /> 6. Quando o cliente quiser fechar
              </h3>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold">Sua chave Pix (fica só neste aparelho)</span>
                <input
                  value={pixKey}
                  onChange={(e) => {
                    setPixKey(e.target.value);
                    try {
                      localStorage.setItem(PIX_KEY, e.target.value);
                    } catch {
                      /* sem armazenamento */
                    }
                  }}
                  className={field}
                />
              </label>
              <div className="space-y-3">
                {dropdown("w", "1. Pedir fotos, textos e dados", welcome)}
                {dropdown("p", "2. Combinar o pagamento", payment)}
                {dropdown("d", "3. Entregar o site", delivery)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onProposal({ ...lead, name })} className={btnGhost}>
                  Gerar proposta (PDF)
                </button>
                <button type="button" onClick={() => download(`site-${slugify(name)}.html`, finalHtml, "text/html;charset=utf-8")} className={btnGhost}>
                  <Download className="size-4" /> Baixar o site (.html)
                </button>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={indexable} onChange={(e) => setIndexable(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-primary)]" />
                <span>
                  Permitir que a versão final apareça no Google. Só faz sentido depois que o site estiver no domínio do cliente;
                  neste endereço, deixe desmarcado.
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!slug || busy === "final"}
                  onClick={async () => {
                    setBusy("final");
                    const res = await setSiteMode({ data: { key: accessKey, deviceId, slug, kind: "final", indexable } }).catch(() => null);
                    if (res?.ok) {
                      setMode("final");
                      notify("Versão final publicada, sem o aviso de demonstração");
                    } else setError("Não consegui publicar a versão final.");
                    setBusy("");
                  }}
                  className={btnGhost}
                >
                  Publicar versão final (tira o aviso)
                </button>
                <button type="button" onClick={() => onWon(lead.id)} className={`${btnPrimary} px-4 py-2 text-sm`}>
                  <CheckCircle2 className="size-4" /> Marcar como fechado
                </button>
              </div>
              <p className="text-xs text-muted">
                Domínio próprio: compre o domínio do cliente (por exemplo, no Registro.br) e hospede o arquivo baixado na
                Vercel ou na Netlify em nome dele. Aqui no painel o site fica no endereço do seu próprio painel.
              </p>
            </section>
          </div>

          <div className={`lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] ${pane === "editar" ? "hidden lg:block" : ""}`}>
            <div className={`flex h-[78vh] flex-col overflow-hidden lg:h-full ${card}`}>
              <div className="flex items-center justify-between gap-2 border-b border-border p-2">
                <p className="px-2 text-sm font-semibold">Prévia ao vivo</p>
                <div className="flex gap-1">
                  <button type="button" aria-label="Celular" onClick={() => setDevice("mobile")} className={chip(device === "mobile")}>
                    <Smartphone className="size-4" />
                  </button>
                  <button type="button" aria-label="Computador" onClick={() => setDevice("desktop")} className={chip(device === "desktop")}>
                    <Monitor className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-1 justify-center overflow-auto bg-surface-2 p-3">
                <iframe
                  title="Prévia do site"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-popups"
                  className="h-full min-h-[480px] rounded-xl border border-border bg-white"
                  style={{ width: device === "mobile" ? 390 : "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Meus sites ---------- */

export function MySitesModal({
  accessKey,
  deviceId,
  onClose,
  onAccessError,
  notify,
}: {
  accessKey: string;
  deviceId: string;
  onClose: () => void;
  onAccessError: (code: string) => void;
  notify: (text: string) => void;
}) {
  const [sites, setSites] = useState<MySite[] | null>(null);

  async function load() {
    const res = await listMySites({ data: { key: accessKey, deviceId } }).catch(() => null);
    if (!res) return setSites([]);
    if (!res.ok) {
      if (ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
      return setSites([]);
    }
    setSites(res.sites);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-fg/40 p-4 backdrop-blur-sm sm:items-center">
      <div className={`max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 ${card}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Meus sites</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} className="text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>
        {sites === null ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </p>
        ) : sites.length === 0 ? (
          <p className="text-sm text-muted">Você ainda não publicou nenhum site. Abra um lead do pipeline e toque em “Criar site”.</p>
        ) : (
          <div className="divide-y divide-border">
            {sites.map((site) => {
              const url = `${window.location.origin}/s/${site.slug}`;
              return (
                <div key={site.slug} className="space-y-2 py-3 text-sm">
                  <p className="font-semibold">
                    {site.name}
                    <span className="ml-2 text-xs font-medium text-muted">
                      {site.kind === "final" ? "final" : "prévia"} · {site.views} visitas
                      {site.status !== "ativo" ? " · suspenso" : ""}
                    </span>
                  </p>
                  {site.expiresAt && (
                    <p className="text-xs text-muted">Expira em {new Date(site.expiresAt).toLocaleDateString("pt-BR")}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <a href={url} target="_blank" rel="noreferrer" className={btnGhost}>
                      <ExternalLink className="size-4" /> Abrir
                    </a>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => navigator.clipboard?.writeText(url).then(() => notify("Link copiado")).catch(() => undefined)}
                    >
                      <Copy className="size-4" /> Copiar link
                    </button>
                    <button
                      type="button"
                      className={`${btnGhost} text-danger`}
                      onClick={async () => {
                        if (!window.confirm(`Apagar o site de ${site.name}? O link deixa de funcionar.`)) return;
                        await deleteSite({ data: { key: accessKey, deviceId, slug: site.slug } }).catch(() => null);
                        await load();
                      }}
                    >
                      <Trash2 className="size-4" /> Apagar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
