'use client';

import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

export default function HistoryItem({ item, onRollback }) {
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.company)}&size=60&background=0D8ABC&color=fff&bold=true`;
  const isAccepted = item.action === 'accepted';

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-3 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <img 
          src={logoUrl}
          alt={`${item.company} logo`}
          className="w-14 h-14 rounded-xl flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {item.position}
              </h3>
              <p className="text-sm text-gray-600 truncate">{item.company}</p>
              <p className="text-xs text-gray-500 mt-1">{item.location}</p>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              isAccepted 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isAccepted ? '✓ Accepted' : '✗ Rejected'}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-500">
              {getRelativeTime(item.timestamp)}
            </p>
            
            {onRollback && (
              <button
                onClick={onRollback}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
                Undo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
