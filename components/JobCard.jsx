'use client';

import { FlagIcon } from '@heroicons/react/24/outline';
import { FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid';
import { useJobs } from '@/context/JobContext';

export default function JobCard({ job, style, onSwipe, onReportClick }) {
  const { reportedJobs, unreportJob } = useJobs();
  
  if (!job) return null;
  
  const isReported = reportedJobs.some(report => report.jobId === job.id);
  
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Posted today';
    if (diffInDays === 1) return 'Posted 1 day ago';
    return `Posted ${diffInDays} days ago`;
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    
    // If already reported, unreport it
    if (isReported) {
      unreportJob(job.id);
    } else {
      // If not reported, open modal to select reason
      if (onReportClick) {
        onReportClick();
      }
    }
  };

  // Get first line of description
  const descriptionPreview = job.description.includes('.') 
    ? job.description.split('.')[0] + '.' 
    : job.description;

  // Generate company logo URL
  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=80&background=0D8ABC&color=fff&bold=true`;

  return (
    <div 
      className="absolute inset-0 w-full h-full select-none"
      style={style}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 relative overflow-hidden">
          <div className="flex items-center space-x-4">
            <img 
              src={logoUrl}
              alt={`${job.company} logo`}
              className="w-20 h-20 rounded-2xl shadow-lg bg-white"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{job.company}</h2>
              <p className="text-blue-100 text-sm">{job.location}</p>
            </div>
          </div>
        </div>

        {/* Job details */}
        <div className="flex-1 p-6 overflow-y-auto touch-pan-y">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {job.position}
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-3">
              {getRelativeTime(job.postedDate)}
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">
              {descriptionPreview}
            </p>
          </div>

          {/* Report button - moved below job details */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleReportClick}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors pointer-events-auto"
              aria-label={isReported ? "Job reported" : "Report job"}
            >
              {isReported ? (
                <FlagIconSolid className="h-4 w-4 flex-shrink-0" />
              ) : (
                <FlagIcon className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{isReported ? "Reported" : "Report this job"}</span>
            </button>
          </div>
        </div>

        {/* Swipe indicators */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="swipe-accept opacity-0 transition-opacity">
            <div className="bg-green-500 text-white font-bold text-3xl px-8 py-4 rounded-2xl shadow-2xl rotate-12">
              ACCEPT
            </div>
          </div>
          <div className="swipe-reject opacity-0 transition-opacity">
            <div className="bg-red-500 text-white font-bold text-3xl px-8 py-4 rounded-2xl shadow-2xl -rotate-12">
              REJECT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
