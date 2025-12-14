'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJobs } from '@/context/JobContext';
import { ArrowLeftIcon, ArrowDownTrayIcon, CheckIcon, XMarkIcon, DocumentArrowUpIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import ApplicationTimeline from '@/components/ApplicationTimeline';

const APPLICATION_STAGES = [
  'Syncing',
  'CV Verification',
  'Being Applied',
  'Message Verification',
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
  const [verificationState, setVerificationState] = useState(null); // 'pending', 'accepted', 'rejected'
  const [lastDecisionTime, setLastDecisionTime] = useState(null);
  const [canRollback, setCanRollback] = useState(false);
  const [, setTick] = useState(0); // Force re-render for countdown

  useEffect(() => {
    const appId = params.id;
    const foundApp = applications.find(a => a.id === appId);
    if (foundApp) {
      setApplication(foundApp);
      // Check if this app requires verification (this would come from backend in real app)
      // For CV Verification stage, show document verification UI
      if (foundApp.stage === 'CV Verification') {
        setVerificationState('pending');
      }
    }
  }, [params.id, applications]);

  // Rollback timer - 5 minutes
  // Separate intervals for logic (10s) and display (1s) for better UX
  useEffect(() => {
    if (lastDecisionTime) {
      const checkRollback = () => {
        const now = Date.now();
        const elapsed = now - lastDecisionTime;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (elapsed >= fiveMinutes) {
          setCanRollback(false);
          setLastDecisionTime(null);
        } else {
          setCanRollback(true);
          setTick(t => t + 1); // Force re-render to update countdown display
        }
      };

      checkRollback();
      // Use 1s interval for smooth countdown display
      const interval = setInterval(checkRollback, 1000);
      
      return () => clearInterval(interval);
    } else {
      setCanRollback(false);
    }
  }, [lastDecisionTime]);

  const handleStageChange = async (e) => {
    const newStage = e.target.value;
    if (application) {
      await updateApplicationStage(application.id, newStage);
      // Update local state
      setApplication({ ...application, stage: newStage });
    }
  };

  const handleVerificationAccept = () => {
    setVerificationState('accepted');
    setLastDecisionTime(Date.now());
    // TODO: Call API to mark documents as verified and proceed with application
    console.log('Documents verified and accepted');
  };

  const handleVerificationReject = () => {
    setVerificationState('rejected');
    setLastDecisionTime(Date.now());
    // TODO: Call API to reject auto-generated documents
    console.log('Documents rejected');
  };

  const handleRollback = () => {
    setVerificationState('pending');
    setLastDecisionTime(null);
    setCanRollback(false);
    console.log('Verification decision rolled back');
  };

  const handleCustomDocumentUpload = (type) => (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Upload custom document
      console.log(`Custom ${type} uploaded:`, file.name);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'Syncing': 'bg-orange-100 text-orange-700',
      'CV Verification': 'bg-purple-100 text-purple-700',
      'Being Applied': 'bg-amber-100 text-amber-700',
      'Message Verification': 'bg-indigo-100 text-indigo-700',
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

  const getRemainingTime = () => {
    if (!lastDecisionTime) return '';
    const now = Date.now();
    const elapsed = now - lastDecisionTime;
    const remaining = (5 * 60 * 1000) - elapsed;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  const showVerification = verificationState === 'pending';
  const showRejectedUpload = verificationState === 'rejected';

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <button
            onClick={() => router.push('/applications')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* Single consolidated card with all information */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Company header with gradient - smaller */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
            <div className="flex items-center gap-3">
              <img 
                src={logoUrl}
                alt={`${application.company} logo`}
                className="w-12 h-12 rounded-lg shadow-lg bg-white flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white mb-0.5">{application.company}</h1>
                <p className="text-sm text-blue-100">{application.location}</p>
              </div>
            </div>
          </div>

          {/* Main content area - reduced spacing */}
          <div className="p-4">
            {/* Position title */}
            <h2 className="text-base font-bold text-gray-900 mb-2">
              {application.position}
            </h2>

            {/* Application dates - smaller */}
            <div className="mb-3 text-xs text-gray-600">
              Applied {new Date(application.appliedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
              {application.updatedAt && application.updatedAt !== application.appliedAt && (
                <> • Updated {new Date(application.updatedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}</>
              )}
            </div>

            {/* Timeline section - reduced spacing */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Progress</h3>
              <ApplicationTimeline 
                currentStage={application.stage}
                timestamps={{
                  'Applied': application.appliedAt,
                  [application.stage]: application.updatedAt || application.appliedAt,
                }}
                interviewCount={application.interviewCount || 1}
              />
            </div>

            {/* Stage selector - reduced spacing */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Update Status</h3>
              
              {application.pendingSync && (
                <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Syncing...</span>
                </div>
              )}

              <select
                value={application.stage}
                onChange={handleStageChange}
                disabled={application.stage === 'Syncing'}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-0 ${
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
                <p className="mt-1 text-[10px] text-gray-500">
                  Status locked until sync completes
                </p>
              )}
            </div>

            {/* Application Documents - reduced spacing */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Documents</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    // TODO: Implement resume download
                    console.log('Download resume for application:', application.id);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  Resume
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement cover letter download
                    console.log('Download cover letter for application:', application.id);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  Cover Letter
                </button>
              </div>
              
              {/* Verification buttons for pending verification */}
              {showVerification && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Do you approve these documents?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleVerificationAccept}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Yes, Approve
                    </button>
                    <button
                      onClick={handleVerificationReject}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      No, Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Rollback button for recent decisions */}
              {canRollback && verificationState !== 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Changed your mind?</p>
                  <button
                    onClick={handleRollback}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                    <span>Undo Decision ({getRemainingTime()})</span>
                  </button>
                </div>
              )}

              {/* Custom document upload for rejected verification */}
              {showRejectedUpload && !canRollback && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Upload your own documents:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <DocumentArrowUpIcon className="h-4 w-4 text-gray-600" />
                      <span className="text-xs text-gray-700">Upload Custom Resume</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCustomDocumentUpload('resume')}
                        className="hidden"
                      />
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <DocumentArrowUpIcon className="h-4 w-4 text-gray-600" />
                      <span className="text-xs text-gray-700">Upload Custom Cover Letter</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCustomDocumentUpload('coverLetter')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Message Verification Section - for Message Verification stage */}
            {application.stage === 'Message Verification' && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Recommended Application Message</h3>
                <p className="text-xs text-gray-600 mb-2">
                  Review the message below that will be sent to the company to apply for this position:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                    {application.recommendedMessage || `Dear Hiring Manager,

I am writing to express my strong interest in the ${application.position} position at ${application.company}. With my background and skills, I believe I would be a valuable addition to your team.

I am excited about the opportunity to contribute to ${application.company} and would welcome the chance to discuss how my experience aligns with your needs.

Thank you for considering my application. I look forward to hearing from you.

Best regards`}
                  </p>
                </div>
                
                {/* Message Verification Actions */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Do you approve this message?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // TODO: Approve message and move to Applied stage
                        console.log('Message approved');
                        updateApplicationStage(application.id, 'Applied');
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Approve & Send
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Allow editing or rejection
                        console.log('Message rejected');
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Edit Message
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Skills - reduced spacing */}
            {application.skills && application.skills.length > 0 && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {application.skills.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {application.skills.length > 6 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">
                      +{application.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description if available - reduced */}
            {application.description && (
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-line line-clamp-4">
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
