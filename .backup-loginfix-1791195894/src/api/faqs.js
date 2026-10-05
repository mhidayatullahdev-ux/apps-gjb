import api from './client';

export const faqsApi = {
  list: (category) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return api.get(`/api/faqs${q}`, { auth: false });
  },
};

export default faqsApi;