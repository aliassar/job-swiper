'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipe } from '@/context/SwipeContext';
import { useSkippedJobs } from '@/lib/hooks/useSWR';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';
import { jobsApi } from '@/lib/api';

export default function SkippedJobsPage() {
  const router = useRouter();
  const { rollbackLastAction } = useSwipe();
  const [searchQuery, setSearchQuery] = useState('');

  // Use SWR for data fetching with automatic caching and revalidation
  const { skippedJobs, isLoading, mutate } = useSkippedJobs(searchQuery);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleUnskip = async (jobId) => {
    // Note: This is a simplified version. For proper unskip, we'd need a dedicated function
    // For now, we'll just filter it out locally
    // In a real implementation, you'd call a proper unskip API
    console.log('Unskip job:', jobId);
  };

  const hasJobs = skippedJobs.length > 0;
  const hasResults = skippedJobs.length > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading skipped jobs...</p>
      </div>
    );
  }

  if (!hasJobs) {
    return (
      <div className="h-full overflow-y-auto p-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Skipped Jobs
            </h1>
            <p className="text-sm text-gray-600">
              Review jobs you skipped and add them back to your queue
            </p>
          </div>

          {/* Always show search bar */}
          <div className="mb-4">
            <SearchInput
              placeholder="Search by company, position, or skills..."
              onSearch={handleSearch}
            />
          </div>

          <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-20">
            <div className="text-6xl mb-4">⏭️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No skipped jobs</h2>
            <p className="text-gray-600">
              Jobs you skip will appear here for later review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 pb-8 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Skipped Jobs
          </h1>
          <p className="text-sm text-gray-600">
            Review jobs you skipped and add them back to your queue
          </p>
        </div>

        {/* Always show search bar */}
        <div className="mb-4">
          <SearchInput
            placeholder="Search by company, position, or skills..."
            onSearch={handleSearch}
          />
        </div>

        {!hasResults && hasJobs && (
          <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-600">
              Try adjusting your search query.
            </p>
          </div>
        )}

        {hasResults && (
          <div className="space-y-3">
            {skippedJobs.map((job) => {
              const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=60&background=0D8ABC&color=fff&bold=true`;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={logoUrl}
                      alt={`${job.company} logo`}
                      className="w-14 h-14 rounded-xl flex-shrink-0 cursor-pointer"
                      onClick={() => router.push(`/job/${job.id}`)}
                    />

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 min-w-0 overflow-hidden cursor-pointer"
                          onClick={() => router.push(`/job/${job.id}`)}
                        >
                          <h3 className="font-semibold text-gray-900 truncate">
                            {job.position}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{job.company}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{job.location}</p>
                          {job.skippedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Skipped {new Date(job.skippedAt).toLocaleDateString()}
                            </p>
                          )}

                          {/* Syncing indicator */}
                          {job.pendingSync && (
                            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Syncing...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{job.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action buttons for skipped jobs - Accept/Reject */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Accept the job and create application
                              const data = await jobsApi.acceptJob(job.id);

                              if (data.data?.applicationId) {
                                // Navigate to the application page
                                router.push(`/application/${data.data.applicationId}`);
                              } else {
                                // Refresh the list
                                mutate();
                              }
                            } catch (err) {
                              console.error('Error accepting job:', err);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Reject the job
                              await jobsApi.rejectJob(job.id);
                              // Remove from skipped list
                              mutate();
                            } catch (err) {
                              console.error('Error rejecting job:', err);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
