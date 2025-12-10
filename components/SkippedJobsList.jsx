'use client';

import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useJobs } from '@/context/JobContext';
import { getCompanyLogoUrl, getRelativeTime } from '@/lib/utils';

export default function SkippedJobsList() {
  const { skippedJobs, unskipJob } = useJobs();

  if (skippedJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">⏭️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No skipped jobs</h2>
        <p className="text-gray-600">
          Jobs you skip will appear here so you can review them later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skippedJobs.map((job) => {
        const logoUrl = getCompanyLogoUrl(job.company, 60);
        
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
                    <p className="text-xs text-gray-400 mt-1">
                      Skipped {getRelativeTime(job.skippedAt)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => unskipJob(job)}
                    className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Restore</span>
                  </button>
                </div>
                
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
