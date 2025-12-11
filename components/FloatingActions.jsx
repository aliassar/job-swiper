'use client';

import { 
  XMarkIcon, 
  CheckIcon, 
  BookmarkIcon,
  ForwardIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

export default function FloatingActions({ 
  onReject, 
  onAccept, 
  onSkip,
  onFavorite,
  isFavorite = false,
  disabled = false,
}) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-md mx-auto px-6">
        <div className="flex items-center justify-center gap-4 pointer-events-auto">
          {/* Reject Button */}
          <button
            onClick={onReject}
            disabled={disabled}
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Reject job"
          >
            <XMarkIcon className="h-8 w-8 text-red-500" />
          </button>

          {/* Skip Button */}
          <button
            onClick={onSkip}
            disabled={disabled}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Skip job"
          >
            <ForwardIcon className="h-6 w-6 text-gray-600" />
          </button>

          {/* Favorite Button */}
          <button
            onClick={onFavorite}
            disabled={disabled}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Favorite job"
          >
            {isFavorite ? (
              <BookmarkIconSolid className="h-7 w-7 text-blue-500" />
            ) : (
              <BookmarkIcon className="h-7 w-7 text-gray-600" />
            )}
          </button>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            disabled={disabled}
            className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Accept job"
          >
            <CheckIcon className="h-8 w-8 text-green-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
