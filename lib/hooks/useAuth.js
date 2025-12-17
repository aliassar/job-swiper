import { useState, useEffect } from 'react';
import { isAuthenticated, clearAuthToken, getAuthToken, decodeJWT } from '@/lib/auth';
import { clearAppState } from '@/lib/indexedDB';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
          // Get token using the auth helper for consistency
          const token = await getAuthToken();
          
          // Fetch user data from backend
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSession({ user: data.user });
            setStatus('authenticated');
          } else {
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
