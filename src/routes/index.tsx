import { createFileRoute } from "@tanstack/react-router";
import { MarketingSite } from "@/components/marketing-site";

export const Route = createFileRoute("/")({
  component: MarketingSite,
  head: () => ({
    meta: [
      { title: "LeadHunter — Encontre oportunidades e venda mais" },
      { name: "description", content: "Encontre empresas, organize leads e acompanhe oportunidades comerciais com o LeadHunter." },
    ],
  }),
});
