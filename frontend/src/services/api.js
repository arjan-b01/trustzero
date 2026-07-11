import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAbsoluteUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  if (path.startsWith('/api')) {
    if (cleanBase.endsWith('/api')) {
      return cleanBase + path.substring(4);
    } else {
      return cleanBase + path;
    }
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

// Request Interceptor: Inject JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tz_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Authentication Errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('tz_token');
      localStorage.removeItem('tz_user');
      // Redirect to login if window is available
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
