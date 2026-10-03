import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'hiretrack_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  config.headers = config.headers || {};

  if (token) {
    config.headers.set?.('Authorization', `Bearer ${token}`);
    if (!config.headers.set) config.headers.Authorization = `Bearer ${token}`;
  } else {
    config.headers.delete?.('Authorization');
    if (!config.headers.delete) delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const responseMessage = error.response?.data?.message;
    const message = responseMessage || (
      error.response
        ? 'The request could not be completed. Please try again.'
        : 'Unable to connect to the HireTrack server. Check that the backend is running and try again.'
    );

    return Promise.reject(new Error(message));
  }
);

const toParams = (queryParams) => {
  const params = {};
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) params[key] = value;
  });
  return params;
};

export const register = (formData) => api.post('/auth/register', formData);
export const login = (formData) => api.post('/auth/login', formData);
export const logout = () => api.post('/auth/logout');
export const getCurrentUser = () => api.get('/auth/me');

export const createApplication = (formData) => api.post('/applications', formData);
export const getApplications = (queryParams = {}) => api.get('/applications', { params: toParams(queryParams) });
export const getApplicationById = (id) => api.get(`/applications/${id}`);
export const updateApplication = (id, formData) => api.put(`/applications/${id}`, formData);
export const updateApplicationStatus = (id, status) => api.patch(`/applications/${id}/status`, { status });
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getApplicationStats = () => api.get('/applications/stats');
export const getFollowUps = () => api.get('/applications/follow-ups');
export const updateFollowUpStatus = (id, followUpStatus) => api.patch(`/applications/${id}/follow-up`, { followUpStatus });
export const getAnalytics = () => api.get('/analytics');

export const createSavedJob = (formData) => api.post('/saved-jobs', formData);
export const getSavedJobs = (queryParams = {}) => api.get('/saved-jobs', { params: toParams(queryParams) });
export const getSavedJobById = (id) => api.get(`/saved-jobs/${id}`);
export const updateSavedJob = (id, formData) => api.put(`/saved-jobs/${id}`, formData);
export const deleteSavedJob = (id) => api.delete(`/saved-jobs/${id}`);
export const getSavedJobStats = () => api.get('/saved-jobs/stats');
export const convertSavedJob = (id, payload) => api.post(`/saved-jobs/${id}/convert`, payload);

export const createInterview = (formData) => api.post('/interviews', formData);
export const getInterviews = (queryParams = {}) => api.get('/interviews', { params: toParams(queryParams) });
export const getInterviewById = (id) => api.get(`/interviews/${id}`);
export const updateInterview = (id, formData) => api.put(`/interviews/${id}`, formData);
export const deleteInterview = (id) => api.delete(`/interviews/${id}`);
