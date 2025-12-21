'use client';

/**
 * Offline Banner Component
 * Shows a banner when the user is offline, with cached data notification
 */

import { WifiIcon } from '@heroicons/react/24/outline';

export default function OfflineBanner({ isOffline, message = "You're offline. Showing cached data." }) {
    // Only render the banner when actually offline
    if (!isOffline) {
        return null;
    }

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
            <WifiIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">{message}</p>
        </div>
    );
}
