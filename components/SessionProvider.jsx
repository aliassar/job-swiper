'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAuthToken, getAuthHeaders } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Session wrapper that checks authentication status
 * Updated to work with JWT tokens stored in localStorage
 */
function SessionWrapper({ children }) {
  const router = useRouter();
  const [userVerified, setUserVerified] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);
      
      if (authenticated) {
        try {
          // Get token for authenticated requests
          const token = await getAuthToken();
          
          // Check user verification status from backend
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.user && !data.user.emailVerified) {
              setUserVerified(false);
            } else {
              setUserVerified(true);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    checkAuth();
  }, []);

  // Show email verification warning if needed
  if (isAuth && !userVerified) {
    return (
      <div>
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
          <p className="text-sm text-yellow-800">
            ⚠️ Please verify your email to access all features.{' '}
            <button
              onClick={async () => {
                try {
                  const authHeaders = await getAuthHeaders();
                  await fetch(`${API_URL}/api/auth/resend-verification`, {
                    method: 'POST',
                    headers: authHeaders,
                  });
                  alert('Verification email resent!');
                } catch (err) {
                  console.error('Error resending verification:', err);
                }
              }}
              className="underline font-medium hover:text-yellow-900"
            >
              Resend verification email
            </button>
          </p>
        </div>
        {children}
      </div>
    );
  }

  return children;
}

/**
 * Client-side SessionProvider wrapper
 * Replaces NextAuth SessionProvider with JWT-based authentication
 */
export default function SessionProvider({ children }) {
  return (
    <SessionWrapper>
      {children}
    </SessionWrapper>
  );
}

