'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { useSettings } from '@/lib/hooks/useSettings';

const OAUTH_ERROR_KEY = 'oauth_error';
const OAUTH_SUCCESS_KEY = 'oauth_success';

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
      
      // Persist success state for page refreshes
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(OAUTH_SUCCESS_KEY, JSON.stringify({
          message: successMsg,
          timestamp: Date.now(),
        }));
        // Clear any previous error
        sessionStorage.removeItem(OAUTH_ERROR_KEY);
      }
      
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
      
      // Persist error state for page refreshes
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(OAUTH_ERROR_KEY, JSON.stringify({
          message: errorMsg,
          timestamp: Date.now(),
          provider: searchParams.get('provider') || 'unknown',
        }));
      }
    }
  }, [searchParams, router, toast, updateSetting]);

  // Check for persisted error on mount (for page refreshes)
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    
    const storedError = sessionStorage.getItem(OAUTH_ERROR_KEY);
    if (storedError) {
      try {
        const errorData = JSON.parse(storedError);
        // Only show if error is less than 5 minutes old
        if (Date.now() - errorData.timestamp < 5 * 60 * 1000) {
          // Don't show toast again if we just processed it
          if (!hasProcessed.current) {
            toast.error(`Previous OAuth error: ${errorData.message}`);
          }
        } else {
          // Clear old error
          sessionStorage.removeItem(OAUTH_ERROR_KEY);
        }
      } catch (e) {
        sessionStorage.removeItem(OAUTH_ERROR_KEY);
      }
    }
  }, [toast]);

  return null;
}
