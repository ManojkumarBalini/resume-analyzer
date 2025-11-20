import api from './api';

// Auth API functions
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
