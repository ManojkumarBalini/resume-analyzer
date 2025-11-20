import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://resume-analyzer-backend-3dao.onrender.com/api';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for analysis
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
    timeout: 120000,
  });
};

export const getResumes = (params = {}) => {
  return api.get('/resumes', { params });
};

export const getResume = (id) => {
  return api.get(`/resumes/${id}`);
};

export const getResumeStats = () => {
  return api.get('/resumes/stats/overview');
};

export default api;
