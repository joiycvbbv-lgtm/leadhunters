import { createFileRoute } from "@tanstack/react-router";
import { PlanApp } from "@/components/plan-app";

export const Route = createFileRoute("/comprar")({
  component: PlanApp,
  head: () => ({ meta: [{ title: "Comprar acesso — LeadHunter" }] }),
});
