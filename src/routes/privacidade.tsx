import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/components/trust-pages";
export const Route = createFileRoute("/privacidade")({ component: PrivacyPage, head: () => ({ meta: [{ title: "Privacidade | LeadHunter" }, { name: "description", content: "Como o LeadHunter trata informações e dados de uso." }] }) });
