import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  History,
  ImagePlus,
  Loader2,
  Monitor,
  Smartphone,
  Sparkles,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react";
import {
  deleteSite,
  getSiteForLead,
  listMySites,
  listSiteVersions,
  restoreSiteVersion,
  placeDetails,
  publishSite,
  setSiteMode,
  type MySite,
  type SiteVersion,
} from "@/lib/sites.functions";
import { aiCopy } from "@/lib/ai.functions";
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

const card = "glass-panel rounded-[1.6rem]";
const field =
  "w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-fg outline-none placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-deep px-5 py-3 text-sm font-bold text-primary-fg shadow-[0_12px_24px_-12px_rgba(79,70,229,0.65)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:opacity-60";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-fg transition duration-200 hover:border-primary/50 hover:bg-primary-soft hover:text-primary disabled:opacity-50";
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

async function compress(file: File, maxSide: number, quality: number, type: "image/jpeg" | "image/png" | "image/webp"): Promise<string> {
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

async function dominantLogoColor(source: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return resolve(null);
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let red = 0, green = 0, blue = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        const alpha = pixels[i + 3];
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        if (alpha < 120 || brightness < 35 || brightness > 225 || saturation < 22) continue;
        red += r; green += g; blue += b; count += 1;
      }
      if (!count) return resolve(null);
      const hex = (value: number) => Math.round(value / count).toString(16).padStart(2, "0");
      resolve(`#${hex(red)}${hex(green)}${hex(blue)}`);
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("55") && d.length > 11 ? d : `55${d}`;
}

/* ---------- Estúdio ---------- */

type Props = {
  initialPane?: "site" | "prompt";
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
    instagram: lead.siteKind === "social" && lead.website && /instagram\.com/i.test(lead.website) ? lead.website : "",
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
  initialPane = "site",
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
  const [sitePurpose, setSitePurpose] = useState<"cardapio" | "landing" | "catalogo" | "agendamento" | "existente" | null>(null);
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
  const [view, setView] = useState<"site" | "prompt">(initialPane === "prompt" ? "site" : initialPane);
  const [notes, setNotes] = useState(lead.notes || "");
  const [tone, setTone] = useState<"direto" | "acolhedor" | "premium">("direto");
  const [aiBusy, setAiBusy] = useState("");
  const [aiInfo, setAiInfo] = useState("");
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [sitePrompt, setSitePrompt] = useState("");

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
          setSitePurpose("existente");
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

  function chooseSitePurpose(purpose: "cardapio" | "landing" | "catalogo" | "agendamento", label: string) {
    setSitePurpose(purpose);
    setView(initialPane === "prompt" ? "prompt" : "site");
    setSitePrompt("Crie um(a) " + label + " profissional para " + lead.name + ". Use apenas dados confirmados, sem inventar preços, serviços ou horários.");
  }

  function facts() {
    return {
      name: data.name,
      kindLabel: KIND_LABELS[data.kind],
      category: data.category,
      city: data.city,
      address: data.address,
      notes: [sitePrompt.trim() ? `DIREÇÃO CRIATIVA DO VENDEDOR (instruções, não fatos): ${sitePrompt.trim()}` : "", notes].filter(Boolean).join("\n\n").slice(0, 3000),
      hasHours: data.hours.length > 0,
      tone,
    };
  }

  async function writeWithAi(createSite = false) {
    setAiBusy("copy");
    setError("");
    setAiWarnings([]);
    try {
      const res = await aiCopy({ data: { key: accessKey, deviceId, facts: facts() } });
      if (!res.ok) {
        if (ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
        else setError(res.error);
        return;
      }
      const c = res.copy;
      const generatedSite: SiteData = {
        ...data,
        tagline: c.tagline || site.tagline,
        about: c.about || site.about,
        design: c.design || site.design,
        color: c.color || site.color,
        highlights: c.highlights.length ? c.highlights : data.highlights,
        items: c.items.length ? c.items : data.items,
      };
      patch({
        tagline: generatedSite.tagline,
        about: generatedSite.about,
        design: generatedSite.design,
        color: generatedSite.color,
        highlights: generatedSite.highlights,
        items: generatedSite.items,
      });
      if (c.highlights.length) setHlText(c.highlights.join("\n"));
      if (c.items.length) setItemsText(itemsToText(c.items));
      setAiWarnings([...c.warnings, ...(createSite && site.photos.length === 0 ? ["Adicione fotos reais autorizadas do estabelecimento antes de publicar; o rascunho não inventa imagens."] : [])]);
      setAiInfo(String(res.usage.used) + " de " + String(res.usage.limit) + " gerações de IA usadas hoje");
      if (createSite) {
        setView("site");
        setPane("previa");
        if (!isTest) {
          const saved = await publishSite({
            data: { key: accessKey, deviceId, slug, leadRef: lead.id, site: generatedSite, kind: "previa", indexable: false },
          });
          if (!saved.ok) {
            if (ACCESS_ERRORS.includes(saved.error)) onAccessError(saved.error);
            setError(saved.error);
            notify("O site foi gerado na prévia, mas não consegui salvar o link.");
          } else {
            setSlug(saved.slug);
            setMode("previa");
            setIndexable(false);
            notify("Site criado e prévia publicada automaticamente!");
          }
        } else {
          notify("Site criado na prévia. A key de teste não permite publicar o link.");
        }
      } else {
        notify("Textos e identidade visual prontos. Revise antes de publicar.");
      }
    } catch {
      setError("Não consegui falar com a IA agora. Tente de novo.");
    } finally {
      setAiBusy("");
    }
  }

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
        next.push(await compress(file, 1280, 0.72, "image/webp"));
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
      const logo = await compress(file, 480, 0.9, "image/png");
      const color = await dominantLogoColor(logo);
      patch({ logo, ...(color ? { color } : {}) });
      if (color) notify("Cor principal extraída da logomarca.");
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
          <Sparkles className="size-5 text-primary" /> Criador IA · {lead.name}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 lg:hidden">
            <button type="button" onClick={() => setPane("editar")} className={chip(pane === "editar")}>
              Criador
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
      ) : !sitePurpose ? (
        <section className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Antes de criar</p>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Que tipo de site o estabelecimento precisa?</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted">Escolha um formato para orientar a estrutura e os textos. Você revisa tudo antes de publicar.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => chooseSitePurpose("cardapio", "cardápio digital")} className="rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary"><span className="block font-semibold">Cardápio digital</span><span className="mt-1 block text-sm text-muted">Produtos, preços e pedidos por WhatsApp</span></button>
            <button type="button" onClick={() => chooseSitePurpose("landing", "landing page")} className="rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary"><span className="block font-semibold">Landing page</span><span className="mt-1 block text-sm text-muted">Apresentação do negócio com contato em destaque</span></button>
            <button type="button" onClick={() => chooseSitePurpose("catalogo", "catálogo de produtos e serviços")} className="rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary"><span className="block font-semibold">Catálogo</span><span className="mt-1 block text-sm text-muted">Vitrine organizada para mostrar opções</span></button>
            <button type="button" onClick={() => chooseSitePurpose("agendamento", "site de agendamento")} className="rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary"><span className="block font-semibold">Agendamento</span><span className="mt-1 block text-sm text-muted">Serviços e chamada para marcar horário</span></button>
          </div>
        </section>
      ) : (
        <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-2">
          <div className={`space-y-5 ${pane === "previa" ? "hidden lg:block" : ""}`}>
            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

            {view === "site" && (<>
            <section className="space-y-3 p-4 glass-panel rounded-[1.6rem]">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-semibold">Criador de sites com IA</h3>
              </div>
              <p className="text-sm text-muted">Escreva como você imagina o site. A IA interpreta seu briefing, cria os textos, escolhe a direção visual e monta uma prévia responsiva para você revisar antes de entregar ao cliente.</p>
              <textarea
                value={sitePrompt}
                onChange={(event) => setSitePrompt(event.target.value.slice(0, 2500))}
                rows={4}
                maxLength={2500}
                placeholder="Ex.: Crie um site premium para uma sorveteria em Belo Horizonte. Quero uma identidade visual própria, cores inspiradas nos sabores, uma capa marcante, cardápio organizado, localização, botão de WhatsApp bem visível e layout impecável no celular. Não use frases genéricas nem invente preços, produtos ou informações."
                className={field}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted">{sitePrompt.length}/2500 caracteres · Uma geração completa</span>
                <button type="button" onClick={() => void writeWithAi(true)} disabled={loading || Boolean(aiBusy) || !sitePrompt.trim()} className={btnPrimary}>
                  {aiBusy === "copy" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {aiBusy === "copy" ? "Criando seu site..." : "Gerar site com IA"}
                </button>
              </div>
            </section>
            </>)}
          </div>

          <div className={`lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] ${pane === "editar" ? "hidden lg:block" : ""}`}>
            <div className={`flex h-[78vh] min-h-[560px] flex-col overflow-hidden ${card} lg:h-full`}>
              <div className="space-y-3 border-b border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">Prévia responsiva</p>
                    <p className="text-[11px] text-muted">Visualize antes de publicar. As alterações aparecem automaticamente.</p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">AO VIVO</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
                    <button type="button" onClick={() => setDevice("mobile")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${device === "mobile" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-fg"}`}>
                      <Smartphone className="size-4" /> Celular
                    </button>
                    <button type="button" onClick={() => setDevice("desktop")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${device === "desktop" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-fg"}`}>
                      <Monitor className="size-4" /> Computador
                    </button>
                  </div>
                  <span className="text-[10px] font-medium tabular-nums text-muted">
                    {device === "mobile" ? "390 × 844 px" : "Largura adaptável"}
                  </span>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-surface-2 to-surface-2 p-3 sm:p-5">
                {device === "mobile" ? (
                  <div className="w-[min(100%,414px)] shrink-0 rounded-[2.6rem] border-[7px] border-[#17191f] bg-[#17191f] p-[5px] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.65)]">
                    <div className="relative overflow-hidden rounded-[2.05rem] bg-white">
                      <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90" />
                      <iframe
                        title="Prévia do site em celular"
                        srcDoc={previewHtml}
                        sandbox="allow-scripts allow-popups"
                        className="block h-[min(72vh,844px)] min-h-[540px] w-full border-0 bg-white"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full min-w-[300px] overflow-hidden rounded-xl border border-border bg-[#17191f] p-1.5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.45)]">
                    <div className="flex h-8 items-center gap-1.5 rounded-t-lg bg-[#252832] px-3">
                      <span className="size-2 rounded-full bg-[#f87171]" />
                      <span className="size-2 rounded-full bg-[#fbbf24]" />
                      <span className="size-2 rounded-full bg-[#4ade80]" />
                      <div className="ml-3 flex h-5 min-w-0 flex-1 items-center rounded-md bg-[#17191f] px-3 text-[10px] text-white/50">
                        <span className="truncate">{slug ? `${slug}.leadhunter.site` : `${slugify(name || "seu-site")}.seu-dominio.com.br`}</span>
                      </div>
                    </div>
                    <iframe
                      title="Prévia do site em computador"
                      srcDoc={previewHtml}
                      sandbox="allow-scripts allow-popups"
                      className="block h-[min(72vh,900px)] min-h-[540px] w-full border-0 bg-white"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
                <p className="text-[11px] text-muted">Confira textos, fotos, botões e rolagem nas duas telas.</p>
                <button type="button" onClick={() => setPane("editar")} className="text-xs font-semibold text-primary hover:underline lg:hidden">
                  Voltar para edição
                </button>
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
  const [versions, setVersions] = useState<Record<string, SiteVersion[] | null>>({});
  const [versionBusy, setVersionBusy] = useState<string | null>(null);

  async function toggleHistory(slug: string) {
    if (versions[slug]) {
      setVersions((current) => ({ ...current, [slug]: null }));
      return;
    }
    setVersionBusy(slug);
    const res = await listSiteVersions({ data: { key: accessKey, deviceId, slug } }).catch(() => null);
    setVersionBusy(null);
    if (!res?.ok) {
      if (res && !res.ok && ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
      notify("Não foi possível carregar o histórico.");
      return;
    }
    setVersions((current) => ({ ...current, [slug]: res.versions }));
  }

  async function restoreVersion(site: MySite, version: SiteVersion) {
    if (!window.confirm(`Restaurar “${site.name}” para a versão de ${new Date(version.createdAt).toLocaleString("pt-BR")}?`)) return;
    setVersionBusy(site.slug);
    const res = await restoreSiteVersion({ data: { key: accessKey, deviceId, slug: site.slug, versionId: version.id } }).catch(() => null);
    setVersionBusy(null);
    if (!res?.ok) {
      if (res && !res.ok && ACCESS_ERRORS.includes(res.error)) onAccessError(res.error);
      notify(res && !res.ok ? res.error : "Não foi possível restaurar a versão.");
      return;
    }
    notify("Versão restaurada. O site já está atualizado.");
    setVersions((current) => ({ ...current, [site.slug]: null }));
    await load();
  }

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
          <p className="text-sm text-muted">Você ainda não publicou nenhum site. Abra um lead do pipeline e toque em “Criar com IA”.</p>
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
                  <p className="text-xs text-muted">{site.whatsappClicks} cliques no WhatsApp · {site.formSubmissions} formulários iniciados</p>
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
                    <button type="button" className={btnGhost} onClick={() => void toggleHistory(site.slug)} disabled={versionBusy === site.slug}>
                      {versionBusy === site.slug ? <Loader2 className="size-4 animate-spin" /> : <History className="size-4" />}
                      Histórico
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
                  {versions[site.slug] && (
                    <div className="rounded-2xl border border-border bg-surface-2 p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Últimas versões</p>
                      {versions[site.slug]!.length === 0 ? (
                        <p className="text-xs text-muted">Ainda não há versões anteriores para este site.</p>
                      ) : (
                        <div className="space-y-2">
                          {versions[site.slug]!.map((version) => (
                            <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2">
                              <div>
                                <p className="text-xs font-semibold">{new Date(version.createdAt).toLocaleString("pt-BR")}</p>
                                <p className="text-[11px] text-muted">{version.kind === "final" ? "Site final" : "Prévia"} · {version.name}</p>
                              </div>
                              <button type="button" className={btnGhost} onClick={() => void restoreVersion(site, version)} disabled={versionBusy === site.slug}>
                                <RotateCcw className="size-3.5" /> Restaurar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
