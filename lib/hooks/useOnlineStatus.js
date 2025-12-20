/**
 * Hook for detecting online/offline status
 * Provides consistent offline detection across the app
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track online/offline status
 * @returns {{ isOnline: boolean, isOffline: boolean }}
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Sync with current state
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline,
    };
}

export default useOnlineStatus;
