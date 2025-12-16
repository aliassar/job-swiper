/**
 * Authentication token management utilities
 * Handles JWT token storage, retrieval, and validation
 */

const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Get the current authentication token from localStorage
 * @returns {Promise<string|null>} JWT token or null if not authenticated
 */
export async function getAuthToken() {
  try {
    // Check if running in browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Get token from localStorage
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Return null if no token found
    return token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Store authentication token in localStorage
 * @param {string} token - JWT token to store
 */
export function setAuthToken(token) {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
}

/**
 * Remove authentication token from localStorage
 */
export function clearAuthToken() {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
}

/**
 * Check if user is currently authenticated
 * @returns {Promise<boolean>} True if user has a valid token
 */
export async function isAuthenticated() {
  try {
    const token = await getAuthToken();
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get authentication headers for API requests
 * @returns {Promise<Object>} Headers object with Authorization if authenticated
 */
export async function getAuthHeaders() {
  const token = await getAuthToken();
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  
  return {};
}
