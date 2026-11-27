import { createServerFn } from "@tanstack/react-start";
import type { AccessInfo } from "./keys.server";

type Credentials = {
  mode: "login" | "signup";
  email: string;
  password: string;
  name?: string;
  deviceId: string;
};

type Result =
  | { ok: true; token: string; info: AccessInfo }
  | { ok: false; code: string };

export const authenticateEmail = createServerFn({ method: "POST" })
  .validator((data: Credentials) => ({
    mode: data?.mode === "signup" ? "signup" as const : "login" as const,
    email: String(data?.email ?? "").trim().toLowerCase(),
    password: String(data?.password ?? ""),
    name: String(data?.name ?? "").trim(),
    deviceId: String(data?.deviceId ?? ""),
  }))
  .handler(async ({ data }): Promise<Result> => {
    try {
      const { authenticate } = await import("./email-auth.server");
      return await authenticate(data);
    } catch (error) {
      console.error("[email-auth]", error instanceof Error ? error.name : "unknown");
      return { ok: false, code: "ERRO_SERVIDOR" };
    }
  });
