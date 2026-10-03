// src/api/bookings.js
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
  uploadPayment: (id, formData) => api.post(`/api/bookings/${id}/payment`, formData),

  // ✅ Reschedule
  rescheduleTerms: () => api.get('/api/reschedule-terms', { auth: false }),
  reschedule: (id, payload) => api.post(`/api/bookings/${id}/reschedule`, payload),

  // ✅ Cancel
  cancel: (id) => api.post(`/api/bookings/${id}/cancel`),

  // ✅ Invoice — return URL + headers untuk download
  invoiceUrl: (id) => `${BASE_URL}/api/bookings/${id}/invoice`,
  downloadInvoice: async (id) => {
    const token = await getToken();
    return {
      url: `${BASE_URL}/api/bookings/${id}/invoice`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  },
};

export default bookingsApi;