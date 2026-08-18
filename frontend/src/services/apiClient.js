import axios from 'axios';

// Base instance mapped to Express port 5000 naturally
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to push token natively from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('finpilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses for seamless 401 unauth redirect logic
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If not on login page and we receive a hard 401, clear block and redirect
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('finpilot_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
