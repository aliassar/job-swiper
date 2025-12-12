'use client';

import { HeartIcon } from '@heroicons/react/24/solid';
import { useJobs } from '@/context/JobContext';

export default function FavoritesList() {
  const { savedJobs, toggleSaveJob } = useJobs();

  if (savedJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">💝</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved jobs yet</h2>
        <p className="text-gray-600">
          Jobs you save will appear here for easy access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedJobs.map((job) => {
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
                className="w-14 h-14 rounded-xl flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {job.position}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{job.company}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{job.location}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleSaveJob(job)}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-red-50 transition-colors"
                    aria-label="Remove from saved jobs"
                  >
                    <HeartIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
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
