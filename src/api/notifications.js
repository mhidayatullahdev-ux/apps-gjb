import api from './client';
export const notificationsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/notifications${q ? '?' + q : ''}`);
  },
  markRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
};
