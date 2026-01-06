
export interface TelegramMessage {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
    from: { first_name: string };
  };
}

export const deleteTelegramWebhook = async (token: string) => {
  if (!token) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
    return await response.json();
  } catch (error) {
    console.error("Telegram deleteWebhook error:", error);
  }
};

export const fetchTelegramUpdates = async (
  token: string, 
  lastId: number, 
  signal?: AbortSignal
): Promise<TelegramMessage[]> => {
  if (!token) return [];
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${lastId + 1}&timeout=20`,
      { signal }
    );
    
    if (response.status === 409) {
      console.warn("Telegram 409 Conflict: Webhook is active or multiple instances detected. Attempting to clear...");
      return [];
    }
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.ok) return data.result;
    return [];
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("Telegram polling aborted.");
    } else {
      console.error("Telegram polling error:", error);
    }
    return [];
  }
};

export const sendTelegramMessage = async (token: string, chatId: number, text: string) => {
  if (!token || !chatId) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    return await response.json();
  } catch (error) {
    console.error("Telegram send error:", error);
  }
};

export const sendTelegramAction = async (token: string, chatId: number, action: string = 'typing') => {
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action })
    });
  } catch (error) {
    console.error("Telegram action error:", error);
  }
};
