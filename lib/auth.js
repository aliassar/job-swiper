/**
 * Authentication token management utilities
 * Handles JWT token storage, retrieval, and validation
 */

import { getSession } from 'next-auth/react';

/**
 * Get the current authentication token from the session
 * Note: Requires NextAuth session callback to include accessToken
 * @returns {Promise<string|null>} JWT token or null if not authenticated
 */
export async function getAuthToken() {
  try {
    const session = await getSession();
    
    // NextAuth session contains the OAuth access token
    // This is set in the session callback (see app/api/auth/[...nextauth]/route.js)
    if (session?.accessToken) {
      return session.accessToken;
    }
    
    // Fallback: Use session existence as authentication indicator
    // For APIs that only need to verify authentication, not the actual token
    if (session?.user) {
      // Return a placeholder to indicate authenticated state
      // The actual backend should verify the session via NextAuth
      return 'authenticated';
    }
    
    // No valid session found
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Store JWT token in localStorage
 * WARNING: This is provided for custom auth implementations only.
 * Using localStorage for JWT tokens has security implications:
 * - Vulnerable to XSS attacks
 * - Persists across browser sessions
 * 
 * For production use, prefer NextAuth's secure session management
 * or httpOnly cookies.
 * 
 * @param {string} token - JWT token to store
 * @deprecated Use NextAuth session management instead
 */
export function setAuthToken(token) {
  // Runtime warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] setAuthToken: Using localStorage for JWT tokens is insecure and deprecated. ' +
      'Use NextAuth session management instead.'
    );
  }
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }
}

/**
 * Remove authentication token from storage
 * Used during logout
 * @deprecated Use NextAuth signOut() instead
 */
export function clearAuthToken() {
  // Runtime warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[DEPRECATED] clearAuthToken: Use NextAuth signOut() instead.'
    );
  }
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }
}

/**
 * Check if user is currently authenticated
 * @returns {Promise<boolean>} True if user has a valid token
 */
export async function isAuthenticated() {
  try {
    const session = await getSession();
    return !!session?.user;
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
