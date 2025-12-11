'use client';

import { useEffect, useState, useCallback } from 'react';
import { useJobs } from '@/context/JobContext';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';

export default function SkippedJobsPage() {
  const { skippedJobs, fetchSkippedJobs, rollbackLastAction } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSkippedJobs();
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // Fetch from server with search query
    fetchSkippedJobs(query);
  }, [fetchSkippedJobs]);

  const handleUnskip = async (jobId) => {
    // Note: This is a simplified version. For proper unskip, we'd need a dedicated function
    // For now, we'll just filter it out locally
    // In a real implementation, you'd call a proper unskip API
    console.log('Unskip job:', jobId);
  };

  const hasJobs = skippedJobs.length > 0;
  const hasResults = skippedJobs.length > 0;

  if (!hasJobs) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">⏭️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No skipped jobs</h2>
        <p className="text-gray-600">
          Jobs you skip will appear here for later review.
        </p>
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

        {hasJobs && (
          <div className="mb-4">
            <SearchInput 
              placeholder="Search by company, position, or skills..."
              onSearch={handleSearch}
            />
          </div>
        )}

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
                className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow"
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
                      
                      <button
                        onClick={() => handleUnskip(job.id)}
                        className="flex-shrink-0 p-2 rounded-full hover:bg-blue-50 transition-colors group"
                        aria-label="Review again"
                      >
                        <ArrowPathIcon className="h-5 w-5 text-blue-600 group-hover:rotate-180 transition-transform duration-300" />
                      </button>
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
