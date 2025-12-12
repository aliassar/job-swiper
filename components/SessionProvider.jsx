'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * Client-side SessionProvider wrapper for NextAuth
 * This component must be a client component to use next-auth/react
 */
export default function SessionProvider({ children }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
