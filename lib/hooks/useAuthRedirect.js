'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthRedirectHandler, clearAuthRedirectHandler } from '@/lib/api';

/**
 * Hook to set up Next.js router-based auth redirects
 * Include this in your root layout or a high-level component
 */
export function useAuthRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Set up the redirect handler using Next.js router
    setAuthRedirectHandler((url) => {
      router.push(url);
    });
    
    // Clean up on unmount
    return () => {
      clearAuthRedirectHandler();
    };
  }, [router]);
}
