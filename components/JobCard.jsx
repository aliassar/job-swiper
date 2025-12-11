'use client';

import { useState } from 'react';
import { FlagIcon } from '@heroicons/react/24/outline';
import { useJobs } from '@/context/JobContext';
import { getCompanyLogoUrl, getRelativeTime } from '@/lib/utils';
import HamburgerMenu from './HamburgerMenu';

export default function JobCard({ job, style, onSwipe, showAcceptIndicator, showRejectIndicator, isTopCard }) {
  const { reportJob } = useJobs();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  if (!job) return null;

  const handleReportClick = (e) => {
    e.stopPropagation();
    setShowReportDialog(true);
  };

  const handleReportWithReason = async (reason, description) => {
    setIsReporting(true);
    const success = await reportJob(job.id, description, reason);
    setIsReporting(false);

    if (success) {
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportDialog(false);
        setReportSuccess(false);
      }, 1500);
    }
  };

  const handleCloseDialog = () => {
    if (!isReporting) {
      setShowReportDialog(false);
      setReportSuccess(false);
    }
  };

  // Get first line of description
  const descriptionPreview = job.description.includes('.') 
    ? job.description.split('.')[0] + '.' 
    : job.description;

  // Generate company logo URL using utility function
  const logoUrl = getCompanyLogoUrl(job.company);

  return (
    <div 
      className="absolute inset-0 w-full h-full select-none"
      style={style}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            {/* Left side: Logo + Company Info */}
            <div className="flex items-center space-x-4 flex-1">
              <img 
                src={logoUrl}
                alt={`${job.company} logo`}
                className="w-20 h-20 rounded-2xl shadow-lg bg-white flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1 truncate">{job.company}</h2>
                <p className="text-blue-100 text-sm truncate">{job.location}</p>
              </div>
            </div>
            
            {/* Right side: Hamburger + Report buttons (stacked vertically) */}
            {isTopCard && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* Hamburger menu */}
                <div className="bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                  <HamburgerMenu />
                </div>
                
                {/* Report button */}
                <button
                  onClick={handleReportClick}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                  aria-label="Report job"
                >
                  <FlagIcon className="h-6 w-6 text-white flex-shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Job details */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {job.position}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Posted {getRelativeTime(job.postedDate)}
          </p>

          {/* Skills moved above description */}
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
        </div>

        {/* Swipe indicators - controlled by props */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`transition-opacity duration-200 ${showAcceptIndicator ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-green-500 text-white font-bold text-3xl px-8 py-4 rounded-2xl shadow-2xl rotate-12">
              ACCEPT
            </div>
          </div>
          <div className={`transition-opacity duration-200 ${showRejectIndicator ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-red-500 text-white font-bold text-3xl px-8 py-4 rounded-2xl shadow-2xl -rotate-12">
              REJECT
            </div>
          </div>
        </div>

        {/* Report Dialog - Simplified with 3 button options */}
        {showReportDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={handleCloseDialog}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {reportSuccess ? (
                <div className="text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
                  <p className="text-sm text-gray-600">Thank you for your feedback!</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Report this job</h3>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleReportWithReason('not_mine', 'This job does not match my profile or preferences')}
                      className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors font-medium text-left"
                      disabled={isReporting}
                    >
                      Not Mine
                    </button>
                    
                    <button
                      onClick={() => handleReportWithReason('fake', 'This job appears to be fake or a scam')}
                      className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors font-medium text-left"
                      disabled={isReporting}
                    >
                      Fake
                    </button>
                    
                    <button
                      onClick={() => handleReportWithReason('other', 'Other issue with this job posting')}
                      className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors font-medium text-left"
                      disabled={isReporting}
                    >
                      Other
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
