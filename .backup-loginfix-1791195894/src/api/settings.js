import api from './client';
export const settingsApi = {
  get: () => api.get('/api/settings', { auth: false }),
};
