'use client';

import { useState, useCallback, useEffect } from 'react';

let toastIdCounter = 0;
let globalToastHandler = null;

/**
 * Hook for displaying toast notifications
 * Provides success, error, and info toast variants
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastIdCounter;
    const toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  useEffect(() => {
    globalToastHandler = { success, error, info, showToast, dismissToast };
    return () => {
      globalToastHandler = null;
    };
  }, [success, error, info, showToast, dismissToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    info,
  };
}

/**
 * Global toast API for use outside of React components
 */
export const toast = {
  success: (message, duration) => {
    if (globalToastHandler) {
      return globalToastHandler.success(message, duration);
    }
    console.log('[Toast]', message);
  },
  error: (message, duration) => {
    if (globalToastHandler) {
      return globalToastHandler.error(message, duration);
    }
    console.error('[Toast]', message);
  },
  info: (message, duration) => {
    if (globalToastHandler) {
      return globalToastHandler.info(message, duration);
    }
    console.log('[Toast]', message);
  },
};
