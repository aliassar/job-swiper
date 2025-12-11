'use client';

import { useJobs } from '@/context/JobContext';
import HistoryItem from '@/components/HistoryItem';

export default function HistoryPage() {
  const { sessionActions = [], rollbackLastAction } = useJobs();

  if (sessionActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No history yet</h2>
        <p className="text-gray-600">
          Start swiping on jobs to build your history.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Decision History
        </h2>
        <div>
          {sessionActions.map((item, index) => (
            <HistoryItem 
              key={`${item.jobId}-${item.timestamp}-${index}`} 
              item={item}
              onRollback={rollbackLastAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
