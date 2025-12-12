'use client';

import { useState, useCallback } from 'react';
import { useJobs } from '@/context/JobContext';
import HistoryItem from '@/components/HistoryItem';
import SearchInput from '@/components/SearchInput';

export default function HistoryPage() {
  const { sessionActions, rollbackLastAction } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Map sessionActions to history format
  const history = sessionActions || [];

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Filter history based on search query
  const filteredHistory = searchQuery && history
    ? history.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        const job = item.job || {};
        return (
          (job.company || '').toLowerCase().includes(searchLower) ||
          (job.position || '').toLowerCase().includes(searchLower) ||
          item.action.toLowerCase().includes(searchLower)
        );
      })
    : history || [];

  const hasHistory = history && history.length > 0;
  const hasResults = filteredHistory && filteredHistory.length > 0;

  return (
    <div className="min-h-full p-4 pb-8 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Decision History
          </h2>
          <p className="text-sm text-gray-600">
            Review and undo your past swipe decisions
          </p>
        </div>

        {hasHistory && (
          <div className="mb-4">
            <SearchInput 
              placeholder="Search by company, position, or action..."
              onSearch={handleSearch}
            />
          </div>
        )}

        {!hasHistory && (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No history yet</h2>
            <p className="text-gray-600">
              Start swiping on jobs to build your history.
            </p>
          </div>
        )}

        {hasHistory && !hasResults && (
          <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-600">
              Try adjusting your search query.
            </p>
          </div>
        )}

        {hasResults && (
          <div>
            {filteredHistory.map((item) => (
              <HistoryItem 
                key={`${item.jobId}-${item.timestamp}`} 
                item={{
                  id: item.jobId,
                  company: item.job?.company || 'Unknown',
                  position: item.job?.position || 'Unknown',
                  location: item.job?.location || 'Unknown',
                  action: item.action,
                  timestamp: item.timestamp,
                }}
                onRollback={rollbackLastAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
