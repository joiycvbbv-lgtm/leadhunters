import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/components/trust-pages";
export const Route = createFileRoute("/suporte")({ component: SupportPage, head: () => ({ meta: [{ title: "Suporte | LeadHunter" }, { name: "description", content: "Central de ajuda e suporte do LeadHunter." }] }) });
