'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { useSettings } from '@/lib/hooks/useSettings';

/**
 * Handles OAuth callback success/error messages from URL parameters
 * Must be wrapped in Suspense boundary due to useSearchParams
 */
export default function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { updateSetting } = useSettings();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only process once to avoid infinite loops
    if (hasProcessed.current) return;
    
    const successMsg = searchParams.get('success');
    const errorMsg = searchParams.get('error');
    
    if (successMsg) {
      hasProcessed.current = true;
      toast.success(successMsg);
      // Update settings to reflect connected state
      updateSetting('emailConnected', true);
      // Redirect to settings after short delay
      setTimeout(() => {
        router.push('/settings');
      }, 1500);
    }
    
    if (errorMsg) {
      hasProcessed.current = true;
      toast.error(errorMsg);
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}
