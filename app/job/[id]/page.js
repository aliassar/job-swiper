'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSwipe } from '@/context/SwipeContext';
import { useSavedJobs, useSkippedJobs, useReportedJobs, useApplications } from '@/lib/hooks/useSWR';
import { CheckIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import http from '@/lib/http';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { acceptJob, rejectJob } = useSwipe();
  const { savedJobs } = useSavedJobs();
  const { skippedJobs } = useSkippedJobs();
  const { reportedJobs } = useReportedJobs();
  const { applications } = useApplications();
  const [job, setJob] = useState(null);
  const [source, setSource] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jobId = params.id;

    const app = applications.find(a => a.jobId === jobId);
    if (app) {
      setApplicationStatus('accepted');
    }

    let foundJob = savedJobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      setSource('saved');
      setLoading(false);
      return;
    }

    foundJob = skippedJobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      setSource('skipped');
      setLoading(false);
      return;
    }

    const report = reportedJobs.find(r => r.jobId === jobId);
    if (report) {
      setJob(report.job);
      setSource('reported');
      setLoading(false);
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
      setLoading(false);
      return;
    }

    // Could not find in cached data, try fetching from server
    const fetchJob = async () => {
      try {
        const response = await http.get(`/api/jobs/${jobId}`);
        const jobData = response.data || response;
        if (jobData) {
          setJob(jobData);
          setSource('server');
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id, savedJobs, skippedJobs, reportedJobs, applications, jobs]);

  const handleAccept = () => {
    if (job) {
      acceptJob(job);
      router.push('/applications');
    }
  };

  const handleReject = () => {
    if (job) {
      rejectJob(job);
      router.back();
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Posted today';
    if (diffInDays === 1) return 'Posted 1 day ago';
    return `Posted ${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <div className="text-5xl mb-3">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job not found</h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const logoUrl = job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=80&background=0D8ABC&color=fff&bold=true`;
  const isApplication = source === 'application';
  const canActOnJob = (source === 'saved' && applicationStatus !== 'accepted') ||
    source === 'skipped' || source === 'reported' || source === 'pending' || source === 'server';

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Back button header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Job card - same style as JobCard component */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-md mx-auto">
          {/* Header with gradient - same as JobCard */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={`${job.company} logo`}
                className="w-14 h-14 rounded-xl shadow-lg bg-white"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{job.company}</h2>
                <p className="text-blue-100 text-sm truncate">{job.location}</p>
              </div>
            </div>
          </div>

          {/* Job details - same style as JobCard */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {job.position}
            </h3>

            {job.postedDate && (
              <p className="text-xs text-gray-500 mb-2">
                {getRelativeTime(job.postedDate)}
              </p>
            )}

            {job.salary && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg mb-3">
                <span className="text-sm">💰</span>
                <span className="text-xs font-semibold text-green-700">{job.salary}</span>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 6 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{job.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {job.description && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                  {job.description}
                </p>
              </div>
            )}

            {/* Status messages */}
            {isApplication && (
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center text-sm">
                Already in your applications
              </div>
            )}

            {applicationStatus === 'accepted' && source === 'saved' && (
              <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-center text-sm">
                ✓ Already applied
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons - fixed at bottom */}
      {canActOnJob && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-center gap-6 max-w-md mx-auto">
            <button
              onClick={handleReject}
              className="w-14 h-14 rounded-full bg-white border-2 border-red-200 shadow-md flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all"
              aria-label="Reject job"
            >
              <XMarkIcon className="h-7 w-7 text-red-500" />
            </button>
            <button
              onClick={handleAccept}
              className="w-14 h-14 rounded-full bg-white border-2 border-green-200 shadow-md flex items-center justify-center hover:bg-green-50 active:scale-95 transition-all"
              aria-label="Accept job"
            >
              <CheckIcon className="h-7 w-7 text-green-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
