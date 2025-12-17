'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJobs } from '@/context/JobContext';
import { CheckIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, skippedJobs, reportedJobs, applications, acceptJob, rejectJob } = useJobs();
  const [job, setJob] = useState(null);
  const [source, setSource] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null); // 'accepted' or 'rejected' or null

  useEffect(() => {
    const jobId = params.id;

    // Check if job has been accepted (exists in applications)
    const app = applications.find(a => a.jobId === jobId);
    if (app) {
      setApplicationStatus('accepted');
    }

    let foundJob = savedJobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      setSource('saved');
      return;
    }

    foundJob = skippedJobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      setSource('skipped');
      return;
    }

    const report = reportedJobs.find(r => r.jobId === jobId);
    if (report) {
      setJob(report.job);
      setSource('reported');
      return;
    }

    if (app) {
      setJob({
        id: app.jobId,
        company: app.company,
        position: app.position,
        location: app.location,
        skills: app.skills,
      });
      setSource('application');
      return;
    }
  }, [params.id, savedJobs, skippedJobs, reportedJobs, applications]);

  const handleAccept = () => {
    if (job) {
      acceptJob(job);
      // If this was a saved job, navigate to application page
      if (source === 'saved') {
        // Find the newly created application
        setTimeout(() => {
          const app = applications.find(a => a.jobId === job.id);
          if (app) {
            router.push(`/application/${app.id}`);
          } else {
            router.push('/applications');
          }
        }, 100);
      } else {
        router.push('/applications');
      }
    }
  };

  const handleReject = () => {
    if (job) {
      rejectJob(job);
      router.back();
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Posted today';
    if (diffInDays === 1) return 'Posted 1 day ago';
    return `Posted ${diffInDays} days ago`;
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <p className="text-gray-600 mb-6">This job could not be found.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  };

  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=120&background=0D8ABC&color=fff&bold=true`;
  const isApplication = source === 'application';

  // For saved jobs: show actions if not decided, or if rejected (can re-accept)
  // If accepted (applicationStatus === 'accepted'), navigate to application instead
  const canActOnJob = (source === 'saved' && applicationStatus !== 'accepted') ||
    source === 'skipped' ||
    source === 'reported';

  const isSavedAndAccepted = source === 'saved' && applicationStatus === 'accepted';
  const isSavedAndRejected = source === 'saved' && applicationStatus === 'rejected';

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
            <div className="flex items-center gap-6">
              <img
                src={logoUrl}
                alt={`${job.company} logo`}
                className="w-24 h-24 rounded-2xl shadow-lg bg-white"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{job.company}</h1>
                <p className="text-blue-100 text-lg">{job.location}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {job.position}
            </h2>

            {job.postedDate && (
              <p className="text-sm text-gray-500 mb-3">
                {getRelativeTime(job.postedDate)}
              </p>
            )}

            {job.salary && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg mb-6">
                <span className="text-xl">💰</span>
                <span className="text-sm font-semibold text-green-700">
                  {job.salary}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {job.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            )}



            {isApplication && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-center mb-4">
                  This job is already in your applications
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to undo accepting this job? This will remove it from your applications.')) {
                      try {
                        // Call rollback API
                        await fetch(`/api/jobs/${job.id}/rollback`, {
                          method: 'POST',
                        });
                        // Navigate back
                        router.push('/');
                      } catch (err) {
                        console.error('Error rolling back job:', err);
                        alert('Failed to undo accept. Please try again.');
                      }
                    }
                  }}
                  className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo Accept
                </button>
              </div>
            )}

            {isSavedAndAccepted && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-center mb-4">
                  ✓ You have already applied to this job
                </div>
                <button
                  onClick={() => {
                    const app = applications.find(a => a.jobId === job.id);
                    if (app) {
                      router.push(`/application/${app.id}`);
                    }
                  }}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  View Application
                </button>
              </div>
            )}

            {isSavedAndRejected && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-orange-50 text-orange-700 px-4 py-3 rounded-lg text-center">
                  You previously rejected this job, but you can still accept it
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons - Fixed at bottom like main page */}
      {canActOnJob && (
        <div className="fixed bottom-6 left-0 right-0 z-30 pointer-events-none">
          <div className="max-w-md mx-auto px-6">
            <div className="flex items-center justify-center gap-4 pointer-events-auto">
              {/* Reject Button */}
              <button
                onClick={handleReject}
                className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                aria-label="Reject job"
              >
                <XMarkIcon className="h-8 w-8 text-red-500" />
              </button>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                aria-label="Accept job"
              >
                <CheckIcon className="h-8 w-8 text-green-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
