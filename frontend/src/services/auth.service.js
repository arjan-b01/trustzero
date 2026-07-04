import api from './api';

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('tz_token', response.data.token);
      localStorage.setItem('tz_user', JSON.stringify({
        userId: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      }));
    }
    return response.data;
  },

  async register(name, email, password, role) {
    const response = await api.post('/auth/register', { name, email, password, role });
    if (response.data && response.data.token) {
      localStorage.setItem('tz_token', response.data.token);
      localStorage.setItem('tz_user', JSON.stringify({
        userId: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      }));
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('tz_token');
    localStorage.removeItem('tz_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('tz_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('tz_token');
  }
};

export default authService;
