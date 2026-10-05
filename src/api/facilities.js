import api from './client';

export const facilitiesApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/facilities${q ? '?' + q : ''}`, { auth: false });
  },
  detail: (id) => api.get(`/api/facilities/${id}`, { auth: false }),
  availability: (id, date, sportType) => {
    const q = new URLSearchParams({
      date,
      ...(sportType ? { sport_type: sportType } : {}),
    }).toString();
    return api.get(`/api/facilities/${id}/availability?${q}`, { auth: false });
  },
  suggestions: (payload) =>
    api.post('/api/facilities/suggestions', payload, { auth: false }),
};

export default facilitiesApi;
