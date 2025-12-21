import axios from 'axios';
import { getAuthToken, clearAuthToken, refreshToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';

// Create Axios instance
const http = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Default timeout (optional, but good practice)
  timeout: 30000,
});

// Flag to prevent multiple concurrent refreshes
let isRefreshing = false;
// Queue of failed requests awaiting token refresh
let failedQueue = [];

/**
 * Add a request to the failed queue
 * @param {Function} onTokenRefreshed - Callback when token is refreshed
 */
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

// Auth Redirect Handler logic (kept local to avoid circular deps if possible, or we can export a setter like in api.js)
let authRedirectHandler = null;

export function setAuthRedirectHandler(handler) {
  authRedirectHandler = handler;
}

export function clearAuthRedirectHandler() {
  authRedirectHandler = null;
}

function handleAuthFailure() {
  if (typeof window !== 'undefined') {
    clearAuthToken();

    // Check if already on login page or related auth pages to avoid loops
    const path = window.location.pathname;
    if (path === LOGIN_URL || path.startsWith('/login/') || path.startsWith('/auth/')) {
      return;
    }

    if (authRedirectHandler && typeof authRedirectHandler === 'function') {
      try {
        authRedirectHandler(LOGIN_URL);
      } catch (e) {
        window.location.href = LOGIN_URL;
      }
    } else {
      window.location.href = LOGIN_URL;
    }
  }
}

// REQUEST INTERCEPTOR
http.interceptors.request.use(
  async (config) => {
    // Get token (check expiry if needed, but we rely on response interceptor for refresh usually)
    // Note: getAuthToken checks localStorage
    const token = await getAuthToken();

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Idempotency Key handling (passed in config)
    if (config.idempotencyKey) {
      config.headers['X-Idempotency-Key'] = config.idempotencyKey;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
http.interceptors.response.use(
  (response) => {
    // Unwrap response data
    // Server returns: { success: true, data: { ... } }
    // We return: response.data.data || response.data

    // Check for 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = response.data;
    return data && data.data !== undefined ? data.data : data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return http(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const success = await refreshToken();

        if (success) {
          const newToken = await getAuthToken();
          http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          isRefreshing = false;

          return http(originalRequest);
        } else {
          // Refresh failed
          processQueue(new Error('Token refresh failed'), null);
          isRefreshing = false;
          handleAuthFailure();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    // Wrap error message from server if available
    if (error.response && error.response.data && error.response.data.error) {
      // Return a rejected promise with a new Error object containing the server message
      return Promise.reject(new Error(error.response.data.error));
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to download file (Axios version)
 */
export async function downloadFile(endpoint, filename) {
  try {
    const response = await http.get(endpoint, {
      responseType: 'blob', // Important for downloads
      // We need the raw response to get the blob, so we might need to bypass the unwrap interceptor?
      // Actually, unwrapping logic: `data && data.data !== undefined ? data.data : data`
      // For blob, response.data is the blob. `blob.data` is undefined. So it returns the blob. Correct.
    });

    // Note: Interceptor returns the data (blob), not the response object
    const blob = response;

    if (typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error(`Download error [${endpoint}]:`, error);
    throw error;
  }
}

export default http;
