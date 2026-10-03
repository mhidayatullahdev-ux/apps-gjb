// src/api/auth.js
import api from './client';

export const authApi = {
  register: (data) => api.post('/api/register', data, { auth: false }),
  login: (data) => api.post('/api/login', data, { auth: false }),
  google: (data) => api.post('/api/auth/google', data, { auth: false }),
  profile: () => api.get('/api/profile'),
  updateProfile: (data) => api.put('/api/profile', data),
  updateProfileWithAvatar: (formData) =>
    api.post('/api/profile', formData, {
      headers: { 'X-HTTP-Method-Override': 'PUT' },
    }),
  completeProfile: (data) => api.post('/api/profile/complete', data),
  changePassword: (data) => api.post('/api/profile/change-password', data),

  // ✅ Reset password dengan OTP
  forgotPassword: (data) => api.post('/api/forgot-password', data, { auth: false }),
  resetPassword: (data) => api.post('/api/reset-password', data, { auth: false }),

  logout: () => api.post('/api/logout'),
};

export default authApi;
