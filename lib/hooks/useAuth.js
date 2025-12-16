import { useState, useEffect } from 'react';
import { isAuthenticated, clearAuthToken } from '@/lib/auth';

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
          // Fetch user data from backend
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
export function signOut() {
  clearAuthToken();
  window.location.href = '/login';
}
