import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/app" });
  },
  head: () => ({
    meta: [
      { title: "LeadHunter — Aplicativo de prospecção" },
      { name: "description", content: "Acesse o painel LeadHunter para encontrar empresas, organizar leads e acompanhar oportunidades comerciais." },
    ],
  }),
});
