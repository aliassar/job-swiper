'use client';

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Session wrapper that checks authentication status
 */
function SessionWrapper({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userVerified, setUserVerified] = useState(true);

  // Query /auth/me on session mount to check email verification
  useEffect(() => {
    const checkUser = async () => {
      if (status === 'authenticated' && session) {
        try {
          const response = await fetch('/api/auth/me');
          const data = await response.json();
          
          if (data.user && !data.user.emailVerified) {
            setUserVerified(false);
            // Optionally redirect to email verification page
            // router.push('/login?error=EmailNotVerified');
          } else {
            setUserVerified(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    checkUser();
  }, [session, status, router]);

  // Show email verification warning if needed
  if (status === 'authenticated' && !userVerified) {
    return (
      <div>
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-center">
          <p className="text-sm text-yellow-800">
            ⚠️ Please verify your email to access all features.{' '}
            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/resend-verification', {
                    method: 'POST',
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
 * Client-side SessionProvider wrapper for NextAuth
 * This component must be a client component to use next-auth/react
 */
export default function SessionProvider({ children }) {
  return (
    <NextAuthSessionProvider>
      <SessionWrapper>
        {children}
      </SessionWrapper>
    </NextAuthSessionProvider>
  );
}

