import { createFileRoute } from "@tanstack/react-router";
import { AdminApp } from "@/components/admin-app";

export const Route = createFileRoute("/admin")({
  component: AdminApp,
  head: () => ({ meta: [{ title: "Admin — LeadHunter" }, { name: "robots", content: "noindex" }] }),
});
