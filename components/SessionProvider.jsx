'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import http from '@/lib/http';

const PUBLIC_PATHS = ['/login', '/login/sign-up', '/login/forgot-password', '/auth/callback', '/auth/verify-email', '/auth/reset-password'];

function SessionWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userVerified, setUserVerified] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);

      const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));

      if (!authenticated && !isPublicPath) {
        router.push('/login');
      } else {
        setLoading(false);
      }

      if (authenticated) {
        try {
          const data = await http.get('/api/auth/me');
          if (data && data.data?.user && !data.data.user.emailVerified) {
            setUserVerified(false);
          } else {
            setUserVerified(true);
          }
        } catch (error) {
          // If 401, interceptor might handle it, but double check
          console.error('Error fetching user data:', error);
        }
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Double check protection (render null if not auth and not public)
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));
  if (!isAuth && !isPublicPath) {
    return null;
  }

  return (
    <>
      {isAuth && !userVerified && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
          <p className="text-sm text-yellow-800">
            ⚠️ Please verify your email to access all features.{' '}
            <button
              onClick={async () => {
                try {
                  await http.post('/api/auth/resend-verification');
                  alert('Verification email resent!');
                } catch (err) {
                  console.error('Error resending verification:', err);
                  alert('Failed to resend verification email.');
                }
              }}
              className="underline font-medium hover:text-yellow-900"
            >
              Resend verification email
            </button>
          </p>
        </div>
      )}
      {children}
    </>
  );
}

export default function SessionProvider({ children }) {
  return (
    <SessionWrapper>
      {children}
    </SessionWrapper>
  );
}
