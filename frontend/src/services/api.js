import axios from 'axios';

// Use environment variable for API base URL or fallback to Render URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://resume-analyzer-backend-3dao.onrender.com/api' 
  : 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  return api.get('/auth/logout');
};

// Resume API
export const uploadResume = (formData) => {
  return api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 seconds timeout for large files
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

export default api;
