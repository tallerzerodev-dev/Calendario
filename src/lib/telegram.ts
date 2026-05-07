const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram env vars missing");
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (!response.ok) {
      console.warn("Telegram send failed", await response.text());
    }
  } catch (error) {
    console.warn("Telegram send error", error);
  }
}
