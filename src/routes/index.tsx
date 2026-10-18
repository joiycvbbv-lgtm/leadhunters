import { createFileRoute } from "@tanstack/react-router";
import { LeadApp } from "@/components/lead-app";

export const Route = createFileRoute("/")({ component: LeadApp });
