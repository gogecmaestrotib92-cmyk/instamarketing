import axios from 'axios';

// Use relative URL in production to support custom domains
// In development, use localhost:5000 via proxy or direct URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API helper functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  connectInstagram: (data) => api.post('/auth/connect/instagram', data),
  connectInstagramWithToken: (data) => api.post('/auth/connect/instagram/token', data),
  autoConnectInstagram: () => api.post('/auth/connect/instagram/auto').then(res => res.data),
  disconnectInstagram: () => api.post('/auth/disconnect/instagram')
};

export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/posts/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/posts/${id}`),
  publish: (id) => api.post(`/posts/${id}/publish`)
};

export const reelsAPI = {
  getAll: (params) => api.get('/reels', { params }),
  getOne: (id) => api.get(`/reels/${id}`),
  create: (data) => api.post('/reels', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/reels/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/reels/${id}`),
  publish: (id) => api.post(`/reels/${id}/publish`)
};

export const campaignsAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getOne: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/campaigns/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/campaigns/${id}`),
  launch: (id) => api.post(`/campaigns/${id}/launch`),
  pause: (id) => api.post(`/campaigns/${id}/pause`),
  resume: (id) => api.post(`/campaigns/${id}/resume`),
  getInsights: (id) => api.get(`/campaigns/${id}/insights`)
};

export const scheduleAPI = {
  getAll: (params) => api.get('/schedule', { params }),
  getCalendar: (params) => api.get('/schedule/calendar', { params }),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  cancel: (id) => api.post(`/schedule/${id}/cancel`),
  delete: (id) => api.delete(`/schedule/${id}`)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getContent: (params) => api.get('/analytics/content', { params }),
  getCampaigns: (params) => api.get('/analytics/campaigns', { params }),
  getAccount: () => api.get('/analytics/account'),
  getBestTimes: () => api.get('/analytics/best-times')
};

export const mediaAPI = {
  upload: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAll: () => api.get('/media'),
  delete: (filename) => api.delete(`/media/${filename}`)
};
