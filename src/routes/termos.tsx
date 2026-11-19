import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/components/trust-pages";
export const Route = createFileRoute("/termos")({ component: TermsPage, head: () => ({ meta: [{ title: "Termos de uso | LeadHunter" }, { name: "description", content: "Condições de uso do LeadHunter." }] }) });
