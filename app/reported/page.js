'use client';

import { useState, useCallback } from 'react';
import { useJobs } from '@/context/JobContext';
import { FlagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';

export default function ReportedJobsPage() {
  const { reportedJobs, unreportJob, fetchReportedJobs } = useJobs();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // Fetch from server with search query
    fetchReportedJobs(query);
  }, [fetchReportedJobs]);

  const hasJobs = reportedJobs.length > 0;
  const hasResults = reportedJobs.length > 0;

  if (!hasJobs) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">🚩</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No reported jobs</h2>
        <p className="text-gray-600">
          Jobs you report will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 pb-8 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Reported Jobs
          </h1>
          <p className="text-sm text-gray-600">
            Jobs you've flagged for review
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
            {reportedJobs.map((report) => {
            const job = report.job;
            const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=60&background=0D8ABC&color=fff&bold=true`;
            
            return (
              <div 
                key={report.id}
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
                        {report.reportedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Reported {new Date(report.reportedAt).toLocaleDateString()}
                          </p>
                        )}
                        
                        {/* Syncing indicator */}
                        {report.pendingSync && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Syncing...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => unreportJob(job.id)}
                          className="flex-shrink-0 p-2 rounded-full hover:bg-blue-50 transition-colors group"
                          aria-label="Unreport job"
                          title="Unreport this job"
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                        </button>
                        <div className="flex-shrink-0 p-2 rounded-full bg-red-50">
                          <FlagIcon className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                    </div>
                    
                    {job.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                    
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
