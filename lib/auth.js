/**
 * Authentication token management utilities
 * Handles JWT token storage, retrieval, and validation
 */

import { getSession } from 'next-auth/react';

/**
 * Get the current authentication token from the session
 * @returns {Promise<string|null>} JWT token or null if not authenticated
 */
export async function getAuthToken() {
  try {
    const session = await getSession();
    
    // NextAuth session contains the JWT token
    // The token is stored in session.accessToken
    if (session?.accessToken) {
      return session.accessToken;
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
