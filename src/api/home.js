import api from './client';
export const homeApi = {
  home: () => api.get('/api/home', { auth: false }),
  settings: () => api.get('/api/settings', { auth: false }),
};
