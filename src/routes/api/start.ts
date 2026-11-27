import { createFileRoute } from "@tanstack/react-router";

function page(message: string, status = 400) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login com Google</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f8ff;color:#0e2a4a;text-align:center;padding:20px"><div><h1 style="font-size:24px;margin:0 0 10px">Login com Google</h1><p style="margin:0 0 18px;color:#5a7391">${message}</p><a href="/" style="color:#1d6fe0;font-weight:700">Voltar ao painel</a></div></body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

async function handle({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
      return page("O login com Google ainda não está configurado. O administrador precisa adicionar as credenciais OAuth na Vercel.", 503);
    }
    const { signBlob } = await import("@/lib/keys.server");
    const { randomBytes } = await import("node:crypto");
    const nonce = randomBytes(16).toString("hex");
    const device = (url.searchParams.get("d") || "").slice(0, 80);
    const state = signBlob({ n: nonce, d: device }, "gstate", 10 * 60_000);
    const origin = process.env.PUBLIC_URL || url.origin;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${origin}/api/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return new Response(null, {
      status: 302,
      headers: {
        location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        "set-cookie": `lh_gn=${nonce}; Path=/api/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[google/start]", error);
    return page("Não consegui iniciar o login com Google. Tente de novo.", 500);
  }
}

export const Route = createFileRoute("/api/google/start")({
  server: { handlers: { GET: handle } },
});
