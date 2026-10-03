// src/api/client.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://service-gor.84.247.188.148.sslip.io';
const TOKEN_KEY = 'dispora.token';

// ============ Global 401 handler ============
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function getToken() {
  try { return await AsyncStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export async function setToken(token) {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

// ============ Retry with exponential backoff ============
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      // Retry hanya untuk 5xx (server error), bukan 4xx (client error)
      if (response.status >= 500 && i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
        console.log(`[API] Retry ${i + 1}/${maxRetries} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (e) {
      lastError = e;
      if (i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i);
        console.log(`[API] Retry ${i + 1}/${maxRetries} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

export async function request(path, opts = {}) {
  const {
    method = 'GET',
    body,
    headers,
    auth = true,
    timeout = 30000,
    retry = true,
  } = opts;

  const url = `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const h = { Accept: 'application/json', ...(headers || {}) };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && body != null) h['Content-Type'] = 'application/json';

  if (auth) {
    const token = await getToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: h,
    body: isFormData ? body : body != null ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  };

  try {
    const res = retry
      ? await fetchWithRetry(url, fetchOptions)
      : await fetch(url, fetchOptions);

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    // ✅ Auto logout kalau 401
    if (res.status === 401) {
      if (onUnauthorized) {
        try { onUnauthorized(); } catch {}
      }
      throw new ApiError(
        (data && data.message) || 'Sesi Anda sudah berakhir. Silakan login ulang.',
        401,
        data
      );
    }

    if (!res.ok) {
      let msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
      if (data && data.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors)[0];
        if (Array.isArray(first) && first[0]) msg = first[0];
      }
      throw new ApiError(msg, res.status, data);
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new ApiError('Koneksi timeout. Periksa jaringan Anda.', 0, null);
    }
    if (e instanceof ApiError) throw e;
    throw new ApiError(e.message || 'Gagal terhubung ke server.', 0, null);
  } finally {
    clearTimeout(timer);
  }
}

const api = {
  get: (p, o) => request(p, { ...o, method: 'GET' }),
  post: (p, b, o) => request(p, { ...o, method: 'POST', body: b }),
  put: (p, b, o) => request(p, { ...o, method: 'PUT', body: b }),
  delete: (p, o) => request(p, { ...o, method: 'DELETE' }),
};

export default api;
