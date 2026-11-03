/** Avisa o dono no Telegram (grátis). Sem as variáveis configuradas, não faz nada. Nunca quebra o fluxo. */
export async function notifyOwner(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 3500) }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* aviso é opcional */
  }
}
