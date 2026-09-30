import axios from 'axios';

// Base instance mapped to Express port 5000 naturally
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Required to send httpOnly cookies (accessToken, refreshToken)
});

// Attach Authorization header from sessionStorage if available (bulletproof for cross-site third-party cookie restrictions)
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('finpilot_access_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/api/auth/refresh' &&
      originalRequest.url !== '/api/auth/login'
    ) {
      
      if (isRefreshing) {
        // If we are already refreshing, queue the requests
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = sessionStorage.getItem('finpilot_refresh_token');
        // Attempt to refresh token using both body (for cross-site fallback) and httpOnly cookie
        const res = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = res.data?.accessToken;
        const newRefreshToken = res.data?.refreshToken;

        if (newAccessToken) {
          sessionStorage.setItem('finpilot_access_token', newAccessToken);
        }
        if (newRefreshToken) {
          sessionStorage.setItem('finpilot_refresh_token', newRefreshToken);
        }

        processQueue(null, newAccessToken);
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        sessionStorage.removeItem('finpilot_access_token');
        sessionStorage.removeItem('finpilot_refresh_token');

        // Clean up any legacy localStorage tokens if present
        localStorage.removeItem('finpilot_token');
        localStorage.removeItem('finpilot_refresh_token');
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');

        // If refresh fails (e.g. refresh token expired), redirect to login
        if (window.location.pathname !== '/login') {
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
