import axios from 'axios';

// Use environment variable for API base URL or fallback to Render URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://resume-analyzer-backend-3dao.onrender.com/api' 
  : 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadResume = (formData) => {
  return api.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getResumes = () => {
  return api.get('/resumes');
};

export const getResume = (id) => {
  return api.get(`/resumes/${id}`);
};

export default api;
