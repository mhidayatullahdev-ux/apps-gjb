import api from './client';
export const articlesApi = {
  list: (page = 1) => api.get(`/api/articles?page=${page}`, { auth: false }),
  detail: (id) => api.get(`/api/articles/${id}`, { auth: false }),
};
