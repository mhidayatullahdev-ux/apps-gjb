import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getToken, BASE_URL } from './client';

const REVERB_KEY = 'def1feacda7b811715aa895e56d742aa';
const REVERB_HOST =
  process.env.EXPO_PUBLIC_REVERB_HOST || 'service-gor.84.247.188.148.sslip.io';
const REVERB_PORT = 443;

// React Native butuh global.Pusher
global.Pusher = Pusher;
Pusher.logToConsole = false; // set true kalau mau debug

let echoInstance = null;
let currentToken = null;

/**
 * Inisialisasi Echo. Return null kalau user belum login (tidak ada token).
 * Otomatis reconnect kalau token berubah.
 */
export async function initEcho() {
  const token = await getToken();
  if (!token) {
    console.warn('[Echo] Token tidak ada, skip init');
    return null;
  }

  // Token sama → pakai instance yang ada
  if (echoInstance && currentToken === token) return echoInstance;

  // Token beda → reconnect dengan token baru
  if (echoInstance) disconnectEcho();

  currentToken = token;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${BASE_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  echoInstance.connector.pusher.connection.bind('connected', () => {
    console.log('[Echo] ✅ Connected ke Reverb');
  });
  echoInstance.connector.pusher.connection.bind('disconnected', () => {
    console.log('[Echo] ⚠️ Disconnected');
  });
  echoInstance.connector.pusher.connection.bind('error', (err) => {
    console.warn('[Echo] ❌ Connection error:', err?.error?.data?.message || err);
  });

  return echoInstance;
}

export function getEcho() {
  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      // diamkan
    }
    echoInstance = null;
    currentToken = null;
    console.log('[Echo] 🔌 Disconnected & reset');
  }
}

export default { initEcho, getEcho, disconnectEcho };