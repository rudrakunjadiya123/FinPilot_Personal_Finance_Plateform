import axios from 'axios';

// Base instance mapped to Express port 5000 naturally
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Required to send httpOnly cookies (refreshToken)
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

// Flag to prevent infinite retry loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Intercept responses for seamless token refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we receive a 401 on a route that is NOT the login or refresh route
    if (error.response && error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh' && originalRequest.url !== '/api/auth/login') {
      
      if (isRefreshing) {
        // If we are already refreshing, queue the requests
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using the httpOnly cookie
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        localStorage.setItem('finpilot_token', newAccessToken);
        
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // If refresh fails (e.g. cookie expired), clear session and redirect
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('finpilot_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
