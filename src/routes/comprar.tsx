import { createFileRoute } from "@tanstack/react-router";
import { ShopApp } from "@/components/shop-app";

export const Route = createFileRoute("/comprar")({
  component: ShopApp,
  head: () => ({ meta: [{ title: "Comprar acesso — LeadHunter" }] }),
});
