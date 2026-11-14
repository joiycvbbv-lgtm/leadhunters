import { createFileRoute } from "@tanstack/react-router";

function page(message: string, status = 400) {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login com Google</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f8ff;color:#0e2a4a;text-align:center;padding:20px"><div><h1 style="font-size:24px;margin:0 0 10px">Login com Google</h1><p style="margin:0 0 18px;color:#5a7391">${message}</p><a href="/" style="color:#1d6fe0;font-weight:700">Voltar ao painel</a></div></body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

function redirect(to: string) {
  return new Response(null, {
    status: 302,
    headers: {
      location: to,
      "cache-control": "no-store",
      "set-cookie": "lh_gn=; Path=/api/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}

async function handle({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return page("O login com Google não está configurado.", 503);
    if (url.searchParams.get("error")) return page("Você cancelou o login com Google.");

    const code = url.searchParams.get("code") || "";
    const { readBlob, signBlob, issueSessionToken } = await import("@/lib/keys.server");
    const state = readBlob<{ n: string; d: string }>(url.searchParams.get("state") || "", "gstate");
    const cookie = (request.headers.get("cookie") || "").match(/(?:^|;\s*)lh_gn=([a-f0-9]+)/)?.[1];
    if (!code || !state || !cookie || cookie !== state.n) return page("A sessão do login expirou. Volte ao painel e tente de novo.");

    const origin = process.env.PUBLIC_URL || url.origin;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/google/callback`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
    });
    const tokens = (await tokenResponse.json().catch(() => null)) as { id_token?: string } | null;
    if (!tokenResponse.ok || !tokens?.id_token) return page("O Google recusou o login. Confira as credenciais configuradas.", 502);

    // O Google confere a assinatura do token para nós.
    const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`, {
      signal: AbortSignal.timeout(8000),
    });
    const info = (await infoResponse.json().catch(() => null)) as {
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      aud?: string;
    } | null;
    if (!infoResponse.ok || !info?.sub || !info.email || info.aud !== clientId) return page("Não consegui confirmar a sua conta Google.", 502);
    if (String(info.email_verified) !== "true") return page("O e-mail dessa conta Google não está verificado.");

    const { getDb } = await import("@/lib/db-app.server");
    const sql = await getDb();
    const rows = await sql.query<{ key_id: number }>("select key_id from google_links where sub = $1", [info.sub]);
    if (rows[0]) return redirect(`/#glogin=${issueSessionToken(rows[0].key_id)}`);

    const ticket = signBlob({ sub: info.sub, email: info.email, name: info.name || "" }, "glink", 15 * 60_000);
    return redirect(`/#glink=${ticket}`);
  } catch (error) {
    console.error("[google/callback]", error);
    return page("Não consegui concluir o login com Google. Tente de novo.", 500);
  }
}

export const Route = createFileRoute("/api/google/callback")({
  server: { handlers: { GET: handle } },
});
