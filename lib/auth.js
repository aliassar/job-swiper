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
    
    // No valid token found - return null
    // The API should handle unauthenticated requests appropriately
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
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
