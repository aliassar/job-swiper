'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipe } from '@/context/SwipeContext';
import { useReportedJobs, useBlockedCompanies } from '@/lib/hooks/useSWR';
import { blockedCompaniesApi } from '@/lib/api';
import { FlagIcon, XMarkIcon, NoSymbolIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';

export default function ReportedJobsPage() {
  const router = useRouter();
  const { unreportJob } = useSwipe();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('reported'); // 'reported' or 'blocked'

  // Use SWR for data fetching with automatic caching and revalidation
  const { reportedJobs, isLoading: isLoadingReported, mutate: mutateReported } = useReportedJobs(searchQuery);
  const { blockedCompanies, isLoading: isLoadingBlocked, mutate: mutateBlocked } = useBlockedCompanies();

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleUnblockCompany = async (companyName) => {
    try {
      await blockedCompaniesApi.unblockCompany(companyName);
      mutateBlocked();
    } catch (error) {
      console.error('Error unblocking company:', error);
    }
  };

  const hasReportedJobs = reportedJobs.length > 0;
  const hasBlockedCompanies = blockedCompanies.length > 0;
  const isLoading = activeTab === 'reported' ? isLoadingReported : isLoadingBlocked;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">
          {activeTab === 'reported' ? 'Loading reported jobs...' : 'Loading blocked companies...'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Reported & Blocked
          </h1>
          <p className="text-sm text-gray-600">
            Manage reported jobs and blocked companies
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('reported')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${activeTab === 'reported'
                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
          >
            <FlagIcon className="h-4 w-4" />
            Reported Jobs
            {reportedJobs.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'reported' ? 'bg-red-200' : 'bg-gray-200'
                }`}>
                {reportedJobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${activeTab === 'blocked'
                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
          >
            <NoSymbolIcon className="h-4 w-4" />
            Blocked Companies
            {blockedCompanies.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'blocked' ? 'bg-orange-200' : 'bg-gray-200'
                }`}>
                {blockedCompanies.length}
              </span>
            )}
          </button>
        </div>

        {/* Search - only show for reported jobs tab */}
        {activeTab === 'reported' && (
          <div className="mb-4">
            <SearchInput
              placeholder="Search by company, position..."
              onSearch={handleSearch}
            />
          </div>
        )}

        {/* Reported Jobs Tab Content */}
        {activeTab === 'reported' && (
          <>
            {!hasReportedJobs ? (
              <div className="flex flex-col items-center justify-center px-6 text-center mt-12">
                <div className="text-6xl mb-4">🚩</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No reported jobs</h2>
                <p className="text-gray-600">
                  Jobs you report will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportedJobs.map((report) => {
                  const job = report.job;
                  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&size=60&background=0D8ABC&color=fff&bold=true`;

                  return (
                    <div
                      key={report.id}
                      onClick={() => router.push(`/job/${job.id}`)}
                      className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={logoUrl}
                          alt={`${job.company} logo`}
                          className="w-14 h-14 rounded-xl flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {job.position}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">{job.company}</p>
                              <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                              {report.reportedAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Reported {new Date(report.reportedAt).toLocaleDateString()}
                                </p>
                              )}

                              {/* Syncing indicator */}
                              {report.pendingSync && (
                                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Syncing...</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unreportJob(job.id);
                                  // Revalidate data after mutation
                                  mutateReported();
                                }}
                                className="flex-shrink-0 p-2 rounded-full hover:bg-blue-50 transition-colors group"
                                aria-label="Unreport job"
                                title="Unreport this job"
                              >
                                <XMarkIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                              </button>
                              <div className="flex-shrink-0 p-2 rounded-full bg-red-50">
                                <FlagIcon className="h-5 w-5 text-red-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Blocked Companies Tab Content */}
        {activeTab === 'blocked' && (
          <>
            {!hasBlockedCompanies ? (
              <div className="flex flex-col items-center justify-center px-6 text-center mt-12">
                <div className="text-6xl mb-4">🏢</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No blocked companies</h2>
                <p className="text-gray-600">
                  When you block a company, jobs from that company won't appear in your feed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedCompanies.map((company) => {
                  const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.companyName)}&size=60&background=EA580C&color=fff&bold=true`;

                  return (
                    <div
                      key={company.id}
                      className="bg-white rounded-2xl shadow-md p-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={logoUrl}
                          alt={`${company.companyName} logo`}
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {company.companyName}
                          </h3>
                          {company.reason && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {company.reason}
                            </p>
                          )}
                          {company.blockedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Blocked {new Date(company.blockedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleUnblockCompany(company.companyName)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Unblock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
