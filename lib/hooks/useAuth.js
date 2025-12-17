import { useState, useEffect } from 'react';
import { isAuthenticated, clearAuthToken, getAuthToken, decodeJWT } from '@/lib/auth';
import { clearAppState } from '@/lib/indexedDB';
import http from '@/lib/http';

/**
 * Custom hook to replace NextAuth's useSession
 * Works with JWT tokens stored in localStorage
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();

      if (authenticated) {
        try {
          // Fetch user data using http client (handles auto-refresh)
          const data = await http.get('/api/auth/me');

          if (data && data.user) {
            setSession({ user: data.user });
            setStatus('authenticated');
          } else {
            // Unexpected response structure
            setSession(null);
            setStatus('unauthenticated');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setSession(null);
          setStatus('unauthenticated');
        }
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    };

    checkAuth();
  }, []);

  return { data: session, status };
}

/**
 * Sign out function to replace NextAuth's signOut
 */
export async function signOut() {
  try {
    // Get current user ID from token before clearing it
    const token = await getAuthToken();
    if (token) {
      // Decode JWT to extract userId without making an API call
      const payload = decodeJWT(token);
      // JWT standard uses 'sub' (subject) claim, but some implementations use 'userId'
      const userId = payload?.sub || payload?.userId;

      // Clear user-specific state
      if (userId) {
        await clearAppState(userId);
      }
    }
  } catch (error) {
    console.error('Error clearing user state on logout:', error);
  }

  // Clear auth token
  clearAuthToken();
  window.location.href = '/login';
}
