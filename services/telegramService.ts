export interface TelegramMessage {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
    from: { first_name: string };
  };
}

export const fetchTelegramUpdates = async (token: string, lastId: number): Promise<TelegramMessage[]> => {
  if (!token) return [];
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastId + 1}&timeout=30`);
    const data = await response.json();
    if (data.ok) return data.result;
    return [];
  } catch (error) {
    console.error("Telegram polling error:", error);
    return [];
  }
};

export const sendTelegramMessage = async (token: string, chatId: number, text: string) => {
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (error) {
    console.error("Telegram send error:", error);
  }
};