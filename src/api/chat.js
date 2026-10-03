import api from './client';
import { initEcho } from './echo';

export const chatApi = {
  messages: (sinceId) =>
    api.get(`/api/chat/messages${sinceId ? `?since_id=${sinceId}` : ''}`),
  send: (message) => api.post('/api/chat/messages', { message }),
};

/**
 * Subscribe ke channel chat user via WebSocket Reverb.
 *
 * @param {number|string} userId
 * @param {(data: object) => void} onMessage - callback saat pesan baru masuk
 * @returns {Promise<() => void>} - fungsi unsubscribe
 */
export async function subscribeChat(userId, onMessage) {
  const echo = await initEcho();
  if (!echo) {
    console.warn('[Chat] Echo tidak tersedia, tidak bisa subscribe');
    return () => {};
  }

  const channel = echo.private(`chat.${userId}`);

  channel.listen('.new-message', (data) => {
    onMessage(data);
  });

  channel.subscribed(() => {
    console.log(`[Chat] ✅ Subscribed ke chat.${userId}`);
  });

  channel.error((err) => {
    console.warn('[Chat] ❌ Subscription error:', err);
  });

  return () => {
    try {
      channel.stopListening('.new-message');
      echo.leave(`private-chat.${userId}`);
      console.log(`[Chat] 🔌 Unsubscribed dari chat.${userId}`);
    } catch (e) {
      // diamkan
    }
  };
}

export default chatApi;