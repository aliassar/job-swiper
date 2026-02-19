'use client';

import { BookmarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { useSwipe } from '@/context/SwipeContext';
import { useSavedJobs, useApplications } from '@/lib/hooks/useSWR';
import { useRouter } from 'next/navigation';

export default function SavedJobsList() {
  const { toggleSaveJob } = useSwipe();
  const { savedJobs } = useSavedJobs();
  const { applications } = useApplications();
  const router = useRouter();

  const handleExportCSV = () => {
    const csvHeaders = 'Company,Position,Location,Salary,Skills,Saved At\n';
    const csvRows = savedJobs.map(job => {
      const skills = (job.requiredSkills || job.skills || []).join('; ');
      const savedAt = job.savedAt || new Date().toISOString();
      return `"${job.company}","${job.position}","${job.location}","${job.salary || 'N/A'}","${skills}","${savedAt}"`;
    }).join('\n');

    const csv = csvHeaders + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-jobs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const PRINT_DELAY = 250; // Delay before triggering print to ensure DOM is ready
    // Create a simple HTML document for printing
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Saved Jobs - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1f2937; margin-bottom: 20px; }
            .job { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .job-title { font-weight: bold; color: #1f2937; font-size: 18px; }
            .company { color: #6b7280; margin: 5px 0; }
            .location { color: #9ca3af; font-size: 14px; margin: 5px 0; }
            .salary { color: #059669; font-weight: 600; margin: 5px 0; }
            .skills { margin-top: 10px; }
            .skill { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; margin: 2px; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Saved Jobs - ${new Date().toLocaleDateString()}</h1>
          ${savedJobs.map(job => `
            <div class="job">
              <div class="job-title">${job.position}</div>
              <div class="company">${job.company}</div>
              <div class="location">${job.location}</div>
              ${job.salary ? `<div class="salary">💰 ${job.salary}</div>` : ''}
              <div class="skills">
                ${(job.requiredSkills || job.skills || []).map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, PRINT_DELAY);
  };

  const handleJobClick = (job) => {
    // Check if this job has been accepted (has an application)
    const application = applications.find(app => app.jobId === job.id);
    if (application) {
      // Navigate to application page
      router.push(`/application/${application.id}`);
    }
  };

  if (savedJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-6xl mb-4">📑</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved jobs yet</h2>
        <p className="text-gray-600">
          Jobs you save will appear here for easy access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportCSV}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {savedJobs.map((job) => {
        const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=60&background=0D8ABC&color=fff&bold=true`;
        const hasApplication = applications.some(app => app.jobId === job.id);

        return (
          <div
            key={job.id}
            onClick={() => handleJobClick(job)}
            className={`bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow overflow-hidden ${hasApplication ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-start gap-4">
              <img
                src={logoUrl}
                alt={`${job.company} logo`}
                className="w-14 h-14 rounded-xl flex-shrink-0"
              />

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {job.position}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{job.company}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{job.location}</p>

                    {/* Salary badge */}
                    {job.salary && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                        <span className="text-xs">💰</span>
                        <span className="text-xs font-semibold text-green-700">
                          {job.salary}
                        </span>
                      </div>
                    )}

                    {/* Has application indicator */}
                    {hasApplication && (
                      <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium ml-2">
                        <span>📋 View Application</span>
                      </div>
                    )}

                    {/* Syncing indicator */}
                    {job.pendingSync && (
                      <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium ml-2">
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Syncing...</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveJob(job);
                    }}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-blue-50 transition-colors"
                    aria-label="Remove from saved jobs"
                  >
                    <BookmarkIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(job.requiredSkills || job.skills || []).slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.requiredSkills || job.skills || []).length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{(job.requiredSkills || job.skills || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
