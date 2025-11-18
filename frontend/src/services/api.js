import axios from 'axios';

// Use environment variable for API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://resume-analyzer-backend-3dao.onrender.com/api';

console.log('API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large files
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    
    if (error.response?.status === 401) {
      console.log('Authentication failed, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const login = (userData) => {
  return api.post('/auth/login', userData);
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const updateProfile = (userData) => {
  return api.put('/auth/updatedetails', userData);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return api.get('/auth/logout');
};

// Resume API
export const uploadResume = (formData) => {
  return api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 minutes for large files
  });
};

export const getResumes = (params = {}) => {
  return api.get('/resumes', { params });
};

export const getResume = (id) => {
  return api.get(`/resumes/${id}`);
};

export const updateResume = (id, data) => {
  return api.put(`/resumes/${id}`, data);
};

export const deleteResume = (id) => {
  return api.delete(`/resumes/${id}`);
};

export const getResumeStats = () => {
  return api.get('/resumes/stats/overview');
};

// Health check
export const healthCheck = () => {
  return api.get('/health');
};

export default api;
