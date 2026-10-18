/**
 * Planos à venda na página /comprar. EDITE AQUI os preços e prazos.
 * priceCents = valor em centavos (4990 = R$ 49,90). days = null significa vitalício.
 */
export type Plan = {
  id: string;
  name: string;
  priceCents: number;
  days: number | null;
  dailyLimit: number;
  tagline: string;
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  { id: "mensal", name: "30 dias", priceCents: 4990, days: 30, dailyLimit: 30, tagline: "Para testar com calma" },
  {
    id: "trimestral",
    name: "90 dias",
    priceCents: 11990,
    days: 90,
    dailyLimit: 40,
    tagline: "O mais escolhido",
    highlight: true,
  },
  { id: "vitalicio", name: "Vitalício", priceCents: 19700, days: null, dailyLimit: 50, tagline: "Pague uma vez e use sempre" },
];

/** Seu WhatsApp de suporte, só números com DDI (ex.: 5531999999999). Vazio = botão escondido. */
export const SUPPORT_WHATSAPP = "";

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
