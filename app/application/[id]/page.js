'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJobs } from '@/context/JobContext';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ApplicationTimeline from '@/components/ApplicationTimeline';

const APPLICATION_STAGES = [
  'Syncing',
  'Being Applied',
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Accepted',
  'Withdrawn',
];

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { applications, updateApplicationStage } = useJobs();
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const appId = params.id;
    const foundApp = applications.find(a => a.id === appId);
    if (foundApp) {
      setApplication(foundApp);
    }
  }, [params.id, applications]);

  const handleStageChange = async (e) => {
    const newStage = e.target.value;
    if (application) {
      await updateApplicationStage(application.id, newStage);
      // Update local state
      setApplication({ ...application, stage: newStage });
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'Syncing': 'bg-orange-100 text-orange-700',
      'Being Applied': 'bg-amber-100 text-amber-700',
      'Applied': 'bg-blue-100 text-blue-700',
      'Phone Screen': 'bg-purple-100 text-purple-700',
      'Interview': 'bg-yellow-100 text-yellow-700',
      'Offer': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Accepted': 'bg-emerald-100 text-emerald-700',
      'Withdrawn': 'bg-gray-100 text-gray-700',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application not found</h2>
          <p className="text-gray-600 mb-6">This application could not be found.</p>
          <button
            onClick={() => router.push('/applications')}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(application.company)}&size=120&background=0D8ABC&color=fff&bold=true`;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/applications')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Applications</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Single consolidated card with all information */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Company header with gradient */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center gap-4">
              <img 
                src={logoUrl}
                alt={`${application.company} logo`}
                className="w-16 h-16 rounded-xl shadow-lg bg-white flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white mb-1">{application.company}</h1>
                <p className="text-blue-100">{application.location}</p>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="p-6">
            {/* Position title */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {application.position}
            </h2>

            {/* Application dates */}
            <div className="mb-4 text-sm text-gray-600">
              Applied {new Date(application.appliedAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
              {application.updatedAt && application.updatedAt !== application.appliedAt && (
                <> • Updated {new Date(application.updatedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</>
              )}
            </div>

            {/* Timeline section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Application Progress</h3>
              <ApplicationTimeline 
                currentStage={application.stage}
                timestamps={{
                  'Applied': application.appliedAt,
                  [application.stage]: application.updatedAt || application.appliedAt,
                }}
                interviewCount={application.interviewCount || 1}
              />
            </div>

            {/* Stage selector */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>
              
              {application.pendingSync && (
                <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Syncing changes...</span>
                </div>
              )}

              <select
                value={application.stage}
                onChange={handleStageChange}
                disabled={application.stage === 'Syncing'}
                className={`w-full px-4 py-3 rounded-lg text-sm font-medium border-0 ${
                  application.stage === 'Syncing'
                    ? 'cursor-not-allowed opacity-70' 
                    : 'cursor-pointer'
                } ${getStageColor(application.stage)}`}
              >
                {APPLICATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              {application.stage === 'Syncing' && (
                <p className="mt-2 text-xs text-gray-500">
                  Application is being synced. Status cannot be changed until sync is complete.
                </p>
              )}
            </div>

            {/* Application Documents */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Application Documents</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    // TODO: Implement resume download
                    console.log('Download resume for application:', application.id);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Resume
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement cover letter download
                    console.log('Download cover letter for application:', application.id);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Cover Letter
                </button>
              </div>
            </div>

            {/* Skills */}
            {application.skills && application.skills.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description if available */}
            {application.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Description</h3>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {application.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
