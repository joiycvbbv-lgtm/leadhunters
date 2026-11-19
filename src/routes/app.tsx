import { createFileRoute } from "@tanstack/react-router";
import { LeadApp } from "@/components/lead-app";

export const Route = createFileRoute("/app")({
  component: LeadApp,
  head: () => ({ meta: [{ title: "Aplicativo LeadHunter" }] }),
});
