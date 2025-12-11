'use client';

import { useJobs } from '@/context/JobContext';
import { getCompanyLogoUrl, getRelativeTime } from '@/lib/utils';
import { FlagIcon } from '@heroicons/react/24/outline';

export default function ReportedJobsPage() {
  const { reportedJobs, loading } = useJobs();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (reportedJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6">
          <FlagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Reported Jobs</h2>
          <p className="text-gray-600 text-sm">
            Jobs you report will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reported Jobs</h1>
        
        <div className="space-y-4">
          {reportedJobs.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-start gap-4">
                <img
                  src={getCompanyLogoUrl(report.job.company)}
                  alt={`${report.job.company} logo`}
                  className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {report.job.position}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {report.job.company} • {report.job.location}
                  </p>
                  
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {report.reason}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">
                    {report.description}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Reported {getRelativeTime(report.reportedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
