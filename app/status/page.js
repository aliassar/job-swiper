'use client';

import JobStatusList from '@/components/JobStatusList';

export default function StatusPage() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Job Status</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your job applications and their progress
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <JobStatusList />
      </div>
    </div>
  );
}
