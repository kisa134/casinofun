import axios from 'axios';

// Автоматически определяем URL в зависимости от окружения
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://casinofun.onrender.com/api'  // Production URL from Render
  : '/api';  // Development (через vite proxy)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const roomsAPI = {
  getAll: (params = {}) => api.get('/rooms', { params }),
  getByCode: (publicCode) => api.get(`/rooms/${publicCode}`),
  create: (data) => api.post('/rooms', data),
  placeBet: (publicCode, data) => api.post(`/rooms/${publicCode}/bet`, data),
  getBets: (publicCode, limit = 20) => api.get(`/rooms/${publicCode}/bets`, { params: { limit } }),
};

export const eventsAPI = {
  getAll: (limit = 50) => api.get('/events', { params: { limit } }),
};

export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
};

export const leaderboardAPI = {
  getHosts: (limit = 10) => api.get('/leaderboard', { params: { type: 'hosts_profit', limit } }),
  getRooms: (limit = 10) => api.get('/leaderboard', { params: { type: 'rooms_volume', limit } }),
};

export const statsAPI = {
  getGlobal: () => api.get('/stats'),
};

export default api;
