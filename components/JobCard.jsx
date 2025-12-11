'use client';

import { useState } from 'react';
import { FlagIcon } from '@heroicons/react/24/outline';
import { useJobs } from '@/context/JobContext';
import { getCompanyLogoUrl, getRelativeTime } from '@/lib/utils';

export default function JobCard({ job, style, onSwipe, showAcceptIndicator, showRejectIndicator }) {
  const { reportJob } = useJobs();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [reportReason, setReportReason] = useState('spam');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  if (!job) return null;

  const handleReportClick = (e) => {
    e.stopPropagation();
    setShowReportDialog(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    setIsReporting(true);
    const success = await reportJob(job.id, reportDescription, reportReason);
    setIsReporting(false);

    if (success) {
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportDialog(false);
        setReportSuccess(false);
        setReportDescription('');
        setReportReason('spam');
      }, 1500);
    }
  };

  const handleCloseDialog = () => {
    if (!isReporting) {
      setShowReportDialog(false);
      setReportDescription('');
      setReportReason('spam');
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
          <button
            onClick={handleReportClick}
            className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
            aria-label="Report job"
          >
            <FlagIcon className="h-6 w-6 text-white flex-shrink-0" />
          </button>
          
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

        {/* Report Dialog */}
        {showReportDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {reportSuccess ? (
                <div className="text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
                  <p className="text-sm text-gray-600">Thank you for your feedback!</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Job</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isReporting}
                    >
                      <option value="spam">Spam</option>
                      <option value="inappropriate">Inappropriate</option>
                      <option value="fake">Fake Job</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please describe the issue..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      required
                      disabled={isReporting}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseDialog}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isReporting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      disabled={isReporting || !reportDescription.trim()}
                    >
                      {isReporting ? 'Reporting...' : 'Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
