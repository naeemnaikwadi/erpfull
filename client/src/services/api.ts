import axios from 'axios';

// Normalize base URL to ensure it includes '/api'
const envBase = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const baseURL = envBase.endsWith('/api') ? envBase : `${envBase.replace(/\/$/, '')}/api`;

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;