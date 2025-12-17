/**
 * Authentication token management utilities
 * Handles JWT token storage, retrieval, and validation
 */

const AUTH_TOKEN_KEY = 'auth_token';

// Clock skew buffer in seconds (to account for time differences between client and server)
const CLOCK_SKEW_BUFFER = 60;

// Time in seconds before expiration to consider token "near expiration" (5 minutes)
const NEAR_EXPIRATION_THRESHOLD = 5 * 60;

/**
 * Decode JWT token payload without verification
 * Note: This does NOT verify the signature - that's the server's responsibility
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 URL decode
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // Decode from base64
    const decoded = Uint8Array.from(atob(paddedBase64), c => c.charCodeAt(0));
    const jsonPayload = new TextDecoder().decode(decoded);

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token has expired
 * @param {string} token - JWT token to check
 * @param {number} bufferSeconds - Buffer time in seconds to account for clock skew (default: 60)
 * @returns {boolean} True if token is expired or invalid
 */
function isTokenExpired(token, bufferSeconds = CLOCK_SKEW_BUFFER) {
  try {
    const payload = decodeJWT(token);
    
    if (!payload || !payload.exp) {
      // If we can't decode or no expiration claim, consider it expired
      return true;
    }

    // JWT exp claim is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Add buffer to current time to account for clock skew
    const bufferedCurrentTime = currentTime + (bufferSeconds * 1000);

    return bufferedCurrentTime >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Treat errors as expired for safety
  }
}

/**
 * Check if a JWT token is near expiration
 * @param {string} token - JWT token to check
 * @param {number} thresholdSeconds - Time in seconds before expiration to consider "near" (default: 300 = 5 minutes)
 * @returns {boolean} True if token will expire soon
 */
function isTokenNearExpiration(token, thresholdSeconds = NEAR_EXPIRATION_THRESHOLD) {
  try {
    const payload = decodeJWT(token);
    
    if (!payload || !payload.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    // Check if token expires within the threshold
    return timeUntilExpiration <= (thresholdSeconds * 1000);
  } catch (error) {
    console.error('Error checking token near expiration:', error);
    return true;
  }
}

/**
 * Check if token is valid without clearing it
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if token appears valid
 */
function isTokenValid(token) {
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Validate and potentially clear an expired token
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if token is valid and not expired
 */
function validateAndCleanToken(token) {
  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    // Clear expired token from localStorage
    clearAuthToken();
    return false;
  }

  return true;
}

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
 * @returns {Promise<boolean>} True if user has a valid, non-expired token
 */
export async function isAuthenticated() {
  try {
    const token = await getAuthToken();
    return validateAndCleanToken(token);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get authentication headers for API requests
 * Note: Does not clear expired tokens - let the server handle 401s
 * @returns {Promise<Object>} Headers object with Authorization if token exists
 */
export async function getAuthHeaders() {
  const token = await getAuthToken();
  
  if (!token) {
    return {};
  }
  
  // Log warning if token is near expiry but don't clear it
  if (isTokenNearExpiration(token)) {
    console.warn('Token is near expiration');
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Check if the current token is near expiration
 * Useful for proactive token refresh or user notification
 * @param {number} thresholdSeconds - Time in seconds before expiration to consider "near" (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} True if token will expire soon, false if no token or not near expiry
 * @note Returns false when no token exists, as there's nothing to warn about or refresh
 */
export async function isTokenNearExpiry(thresholdSeconds = NEAR_EXPIRATION_THRESHOLD) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      // No token means not authenticated - nothing to warn about
      return false;
    }

    return isTokenNearExpiration(token, thresholdSeconds);
  } catch (error) {
    console.error('Error checking token near expiry:', error);
    return false;
  }
}

/**
 * Get the expiration time of the current token
 * @returns {Promise<Date|null>} Expiration date or null if no valid token
 */
export async function getTokenExpiration() {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return null;
    }

    const payload = decodeJWT(token);
    
    if (!payload || !payload.exp) {
      return null;
    }

    // Convert Unix timestamp (seconds) to Date object
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
}
