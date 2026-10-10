import api, { BASE_URL, getToken } from './client';

export const bookingsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/bookings${q ? '?' + q : ''}`);
  },
  detail: (id) => api.get(`/api/bookings/${id}`),
  checkAvailability: (payload) => api.post('/api/bookings/check-availability', payload),
  store: (formData, idempotencyKey) => api.post('/api/bookings', formData, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  }),

  // ✅ Batch: booking beberapa slot sekaligus (satu checkout, satu pembayaran)
  storeBatch: (payload, idempotencyKey) =>
    api.post('/api/bookings/batch', payload, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),

  // ✅ Batch multipart (kalau kirim KTP)
  storeBatchMultipart: (formData, idempotencyKey) =>
    api.post('/api/bookings/batch', formData, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    }),

  // ✅ Detail grup booking
  showGroup: (groupCode) => api.get(`/api/bookings/group/${groupCode}`),

  uploadPayment: (id, formData) => api.post(`/api/bookings/${id}/payment`, formData),
  rescheduleTerms: () => api.get('/api/reschedule-terms', { auth: false }),
  reschedule: (id, payload) => api.post(`/api/bookings/${id}/reschedule`, payload),
  cancel: (id) => api.post(`/api/bookings/${id}/cancel`),
  invoiceUrl: (id) => `${BASE_URL}/api/bookings/${id}/invoice`,

  downloadGroupInvoice: async (groupCode) => {
    const token = await getToken();
    return {
      url: `${BASE_URL}/api/bookings/group/${groupCode}/invoice`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },

  downloadInvoice: async (id) => {
    const token = await getToken();
    return {
      url: `${BASE_URL}/api/bookings/${id}/invoice`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },
};

export default bookingsApi;
