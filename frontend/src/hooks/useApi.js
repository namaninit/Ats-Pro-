import axios from 'axios';
const baseURL = process.env.REACT_APP_API_URL || '';

// const baseURL = process.env.REACT_APP_API_URL || 'https://ats-pro-production-1aa0.up.railway.app';
axios.defaults.baseURL = baseURL;

export const api = axios;

export const candidateAPI = {
  getAll: (params) => axios.get('/api/candidates', { params }),
  getOne: (id) => axios.get(`/api/candidates/${id}`),
  create: (data) => axios.post('/api/candidates', data),
  update: (id, data) => axios.put(`/api/candidates/${id}`, data),
  updateStatus: (id, status) => axios.patch(`/api/candidates/${id}/status`, { status }),
  delete: (id) => axios.delete(`/api/candidates/${id}`),
};

export const clientAPI = {
  getAll: (params) => axios.get('/api/clients', { params }),
  getLite: () => axios.get('/api/clients/lite'),
  getOne: (id) => axios.get(`/api/clients/${id}`),
  create: (data) => axios.post('/api/clients', data),
  update: (id, data) => axios.put(`/api/clients/${id}`, data),
  delete: (id) => axios.delete(`/api/clients/${id}`),
};

export const jobAPI = {
  getAll: (params) => axios.get('/api/jobs', { params }),
  getOne: (id) => axios.get(`/api/jobs/${id}`),
  create: (data) => axios.post('/api/jobs', data),
  update: (id, data) => axios.put(`/api/jobs/${id}`, data),
  delete: (id) => axios.delete(`/api/jobs/${id}`),
};

export const jobTemplateAPI = {
  getAll: () => axios.get('/api/job-templates'),
  create: (data) => axios.post('/api/job-templates', data),
  delete: (id) => axios.delete(`/api/job-templates/${id}`),
};

export const interviewAPI = {
  getAll: (params) => axios.get('/api/interviews', { params }),
  create: (data) => axios.post('/api/interviews', data),
  update: (id, data) => axios.put(`/api/interviews/${id}`, data),
  delete: (id) => axios.delete(`/api/interviews/${id}`),
};

export const dashboardAPI = {
  getStats: () => axios.get('/api/dashboard/stats'),
};

export const userAPI = {
  getAll: () => axios.get('/api/users'),
  create: (data) => axios.post('/api/users', data),
  update: (id, data) => axios.put(`/api/users/${id}`, data),
  delete: (id) => axios.delete(`/api/users/${id}`),
};

export const cvMakerAPI = {
  generate: (data) => axios.post('/api/cv-maker/generate', data),
  getAll: () => axios.get('/api/cv-maker'),
  getOne: (id) => axios.get(`/api/cv-maker/${id}`),
  save: (data) => axios.post('/api/cv-maker', data),
  update: (id, data) => axios.put(`/api/cv-maker/${id}`, data),
  delete: (id) => axios.delete(`/api/cv-maker/${id}`),
};