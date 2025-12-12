'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useJobs } from '@/context/JobContext';
import { useSkippedJobs } from '@/lib/hooks/useSWR';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';

export default function SkippedJobsPage() {
  const router = useRouter();
  const { rollbackLastAction } = useJobs();
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
                onClick={() => router.push(`/job/${job.id}`)}
                className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <img 
                    src={logoUrl}
                    alt={`${job.company} logo`}
                    className="w-14 h-14 rounded-xl flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {job.position}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{job.company}</p>
                        <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                        {job.skippedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Skipped {new Date(job.skippedAt).toLocaleDateString()}
                          </p>
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
