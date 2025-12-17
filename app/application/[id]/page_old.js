'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJobs } from '@/context/JobContext';
import { applicationsApi } from '@/lib/api';
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
  const [resumeUrl, setResumeUrl] = useState(null);
  const [coverLetterUrl, setCoverLetterUrl] = useState(null);

  useEffect(() => {
    const appId = params.id;
    const foundApp = applications.find(a => a.id === appId);
    if (foundApp) {
      setApplication(foundApp);
      
      // Fetch document URLs
      const fetchDocuments = async () => {
        try {
          const docsResponse = await applicationsApi.getDocuments(appId);
          if (docsResponse && docsResponse.success) {
            setResumeUrl(docsResponse.resumeUrl);
            setCoverLetterUrl(docsResponse.coverLetterUrl);
          }
        } catch (docError) {
          console.error('Error fetching documents:', docError);
        }
      };
      
      fetchDocuments();
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
  
  const handleDownloadDocument = async (documentType) => {
    if (!application) return;
    
    const url = documentType === 'resume' ? resumeUrl : coverLetterUrl;
    
    if (!url) {
      alert(`No ${documentType} available for this application. Please upload one in Settings or during CV Check.`);
      return;
    }
    
    // In a real app, this would download from cloud storage
    // For now, simulate download by opening the URL or showing info
    try {
      // Extract filename from URL, handling query params and fragments
      let filename;
      try {
        const urlObj = new URL(url, window.location.origin);
        const pathname = urlObj.pathname;
        filename = pathname.split('/').pop() || `${documentType}-${application.company}-${application.position}.pdf`;
      } catch {
        // Fallback if URL parsing fails
        filename = `${documentType}-${application.company}-${application.position}.pdf`;
      }
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Downloading ${documentType} from:`, url);
    } catch (error) {
      console.error(`Error downloading ${documentType}:`, error);
      alert(`Failed to download ${documentType}. Please try again.`);
    }
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
        {/* Timeline section at the top */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Application Timeline</h3>
            <p className="text-xs text-gray-600">
              Track your application progress through each stage
            </p>
          </div>

          <ApplicationTimeline 
            currentStage={application.stage}
            timestamps={{
              'Applied': application.appliedAt,
              [application.stage]: application.updatedAt || application.appliedAt,
            }}
            interviewCount={application.interviewCount || 1}
          />
        </div>

        {/* Job header card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
            <div className="flex items-center gap-6">
              <img 
                src={logoUrl}
                alt={`${application.company} logo`}
                className="w-24 h-24 rounded-2xl shadow-lg bg-white"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{application.company}</h1>
                <p className="text-blue-100 text-lg">{application.location}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {application.position}
            </h2>

            {/* Application dates */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Applied {new Date(application.appliedAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                {application.updatedAt && application.updatedAt !== application.appliedAt && (
                  <> • Updated {new Date(application.updatedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}</>
                )}
              </p>
            </div>

            {/* Skills */}
            {application.skills && application.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume and Cover Letter Downloads */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Documents</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadDocument('resume')}
                  disabled={!resumeUrl}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    resumeUrl
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download Resume
                </button>
                <button
                  onClick={() => handleDownloadDocument('coverLetter')}
                  disabled={!coverLetterUrl}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    coverLetterUrl
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download Cover Letter
                </button>
              </div>
            </div>

            {/* Description if available */}
            {application.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {application.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stage selector */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Update Stage</h3>
            <p className="text-sm text-gray-600">
              Change the current application stage
            </p>
          </div>

          {application.pendingSync && (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Syncing changes...</span>
            </div>
          )}

          <div>
            <label htmlFor="stage-selector" className="text-sm text-gray-600 mb-2 block">
              Current Stage
            </label>
            <select
              id="stage-selector"
              value={application.stage}
              onChange={handleStageChange}
              disabled={application.stage === 'Syncing'}
              className={`w-full px-4 py-3 rounded-lg text-base font-medium border-0 ${
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
        </div>
      </div>
    </div>
  );
}
