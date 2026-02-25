'use client';

import PropTypes from 'prop-types';
import { FlagIcon } from '@heroicons/react/24/outline';
import { FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid';
import { useSwipe } from '@/context/SwipeContext';
import ReactMarkdown from 'react-markdown';

export default function JobCard({ job, style, onSwipe, onReportClick, isReported = false }) {
  const { unreportJob } = useSwipe();

  // Early return if job is missing or invalid
  if (!job || typeof job !== 'object') return null;

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

  // Use shortDescription if available, otherwise fall back to first sentence of description
  const descriptionPreview = job.shortDescription
    || (job.description
      ? (job.description.includes('.')
        ? job.description.split('.')[0] + '.'
        : job.description)
      : 'No description available');

  // Use logoUrl from database, fallback to ui-avatars if not available
  const logoUrl = job.logoUrl || job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=80&background=0D8ABC&color=fff&bold=true`;

  // Source badge configuration
  const sourceConfig = {
    indeed: { label: 'Indeed', color: 'bg-blue-600', textColor: 'text-white' },
    linkedin: { label: 'LinkedIn', color: 'bg-sky-600', textColor: 'text-white' },
    glassdoor: { label: 'Glassdoor', color: 'bg-green-600', textColor: 'text-white' },
    xing: { label: 'Xing', color: 'bg-orange-500', textColor: 'text-white' },
  };
  const source = job.srcName ? sourceConfig[job.srcName.toLowerCase()] : null;

  // Get skills to display (max 8, required skills have priority)
  const requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const optionalSkills = Array.isArray(job.optionalSkills) ? job.optionalSkills : [];
  const maxSkills = 8;
  const displayedRequiredSkills = requiredSkills.slice(0, maxSkills);
  const remainingSlots = maxSkills - displayedRequiredSkills.length;
  const displayedOptionalSkills = remainingSlots > 0 ? optionalSkills.slice(0, remainingSlots) : [];

  return (
    <div
      className="absolute inset-0 w-full h-full select-none swipeable-card"
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
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{job.company}</h2>
                {source && (
                  <span className={`px-2 py-0.5 ${source.color} ${source.textColor} text-xs font-medium rounded-full`}>
                    {source.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-blue-100 text-sm">{job.location}</p>
                <button
                  onClick={handleReportClick}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors pointer-events-auto"
                  aria-label={isReported ? "Job reported" : "Report job"}
                >
                  {isReported ? (
                    <FlagIconSolid className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <FlagIcon className="h-3.5 w-3.5 text-white/60 hover:text-white" />
                  )}
                </button>
              </div>
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
            <div className="flex flex-wrap gap-2">
              {job.salary && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-lg">💰</span>
                  <span className="text-sm font-semibold text-green-700">
                    {job.salary}
                  </span>
                </div>
              )}
              {job.jobType && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-base">💼</span>
                  <span className="text-sm font-semibold text-purple-700">{job.jobType}</span>
                </div>
              )}
              {job.germanRequirement === 'required' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-base">🇩🇪</span>
                  <span className="text-sm font-semibold text-red-700">German Required</span>
                </div>
              )}
              {/* German Preferred tag hidden per user request */}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {displayedRequiredSkills.map((skill, index) => (
                <span
                  key={`req-${index}`}
                  className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
              {displayedOptionalSkills.map((skill, index) => (
                <span
                  key={`opt-${index}`}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{descriptionPreview}</ReactMarkdown>
            </div>
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

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    position: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    requiredSkills: PropTypes.arrayOf(PropTypes.string),
    optionalSkills: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
    shortDescription: PropTypes.string,
    postedDate: PropTypes.string.isRequired,
    logo: PropTypes.string,
    logoUrl: PropTypes.string,
    srcName: PropTypes.string,
    salary: PropTypes.string,
    jobType: PropTypes.string,
    germanRequirement: PropTypes.string,
    yearsOfExperience: PropTypes.string,
  }),
  style: PropTypes.object,
  onSwipe: PropTypes.func,
  onReportClick: PropTypes.func,
  isReported: PropTypes.bool,
};
