'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationsInfinite, useUpdateApplicationStage } from '@/lib/hooks/useSWR';
import { BriefcaseIcon, CheckCircleIcon, DocumentArrowDownIcon, ArrowTopRightOnSquareIcon, FlagIcon, TrashIcon, ArrowPathIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import OfflineBanner from '@/components/OfflineBanner';
import ReportModal from '@/components/ReportModal';
import { reportedApi, applicationsApi } from '@/lib/api';

const APPLICATION_STAGES = [
    'Being Applied',
    'Applied',
    'In Review',
    'Accepted',
    'Rejected',
    'Withdrawn',
];

export default function ApplicationsClient({ initialData }) {
    const router = useRouter();
    const { updateStage } = useUpdateApplicationStage();
    const [searchQuery, setSearchQuery] = useState('');
    const loadMoreRef = useRef(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [jobToReport, setJobToReport] = useState(null);

    // Use SWR infinite for scroll-based pagination
    const { applications, isLoading, isLoadingMore, isOffline, hasMore, loadMore, mutate } = useApplicationsInfinite(searchQuery);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    // Intersection observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loadMore]);

    // Only show loading when searching
    const showLoading = isLoading && searchQuery !== '';
    const hasApplications = applications.length > 0;
    const hasResults = applications.length > 0;

    const handleOpenReportModal = useCallback((app) => {
        setJobToReport({
            id: app.jobId || app.id,
            company: app.company,
            position: app.position,
        });
        setReportModalOpen(true);
    }, []);

    const handleReport = useCallback(async (reason, blockCompany = false) => {
        if (!jobToReport) return;
        try {
            await reportedApi.reportJob(jobToReport.id, reason, { blockCompany });
        } catch (err) {
            console.error('Error reporting job:', err);
        }
        setReportModalOpen(false);
        setJobToReport(null);
    }, [jobToReport]);

    const handleDeleteApplication = useCallback(async (e, app) => {
        e.stopPropagation();
        if (!confirm(`Delete application for ${app.position} at ${app.company}? The job will be reverted to pending.`)) return;
        try {
            await applicationsApi.deleteApplication(app.id);
            mutate();
        } catch (err) {
            console.error('Error deleting application:', err);
            alert('Failed to delete application');
        }
    }, [mutate]);

    const handleRegenerateDocuments = useCallback(async (e, app) => {
        e.stopPropagation();
        if (!confirm(`Regenerate resume and cover letter for ${app.position} at ${app.company}?`)) return;
        try {
            await applicationsApi.regenerateDocuments(app.id);
            alert('Document regeneration triggered! It may take a minute to complete.');
        } catch (err) {
            console.error('Error regenerating documents:', err);
            alert('Failed to trigger document regeneration');
        }
    }, []);

    const handleArchiveApplication = useCallback(async (e, app) => {
        e.stopPropagation();
        try {
            await applicationsApi.archiveApplication(app.id);
            mutate();
        } catch (err) {
            console.error('Error archiving application:', err);
            alert('Failed to archive application');
        }
    }, [mutate]);

    const getStageColor = (stage) => {
        const colors = {
            'Being Applied': 'bg-amber-100 text-amber-700',
            'Applied': 'bg-blue-100 text-blue-700',
            'In Review': 'bg-purple-100 text-purple-700',
            'Accepted': 'bg-emerald-100 text-emerald-700',
            'Rejected': 'bg-red-100 text-red-700',
            'Withdrawn': 'bg-gray-100 text-gray-700',
        };
        return colors[stage] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="h-full overflow-y-auto p-4 pb-8">
            <div className="max-w-md mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Application Status
                    </h1>
                    <p className="text-sm text-gray-600">
                        Track and update your job application progress
                    </p>
                </div>

                <div className="mb-4">
                    <SearchInput
                        placeholder="Search by company, position, or skills..."
                        onSearch={handleSearch}
                    />
                </div>

                {isOffline && <OfflineBanner />}

                {showLoading && (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-600">Loading applications...</p>
                    </div>
                )}

                {!showLoading && !hasApplications && (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-20">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No applications yet</h2>
                        <p className="text-gray-600">
                            Accept jobs to track your application progress here.
                        </p>
                    </div>
                )}

                {hasResults && (
                    <div className="space-y-3">
                        {applications.map((app) => {
                            const logoUrl = app.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&size=48&background=0D8ABC&color=fff&bold=true`;

                            return (
                                <div
                                    key={app.id}
                                    className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow border border-gray-100"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={logoUrl}
                                            alt={`${app.company} logo`}
                                            className="w-10 h-10 rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                {app.position}
                                            </h3>
                                            <p className="text-xs text-gray-600 truncate">{app.company} • {app.location}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <select
                                                value={app.stage}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    updateStage(app.id, e.target.value, mutate);
                                                    mutate();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={app.pendingSync}
                                                className={`px-2 py-1 rounded-md text-xs font-medium border-0 ${app.pendingSync ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${getStageColor(app.stage)}`}
                                            >
                                                {APPLICATION_STAGES.map((stage) => (
                                                    <option key={stage} value={stage}>
                                                        {stage}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {app.pendingSync && (
                                        <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Syncing...</span>
                                        </div>
                                    )}

                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                {app.postedDate && `Posted ${new Date(app.postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • `}Applied {new Date(app.createdAt || app.appliedAt || app.lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {app.srcName && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${app.srcName.toLowerCase() === 'indeed' ? 'bg-blue-600 text-white' :
                                                        app.srcName.toLowerCase() === 'linkedin' ? 'bg-sky-600 text-white' :
                                                            app.srcName.toLowerCase() === 'xing' ? 'bg-orange-500 text-white' :
                                                                app.srcName.toLowerCase() === 'glassdoor' ? 'bg-green-600 text-white' :
                                                                    'bg-gray-600 text-white'
                                                        }`}>
                                                        {app.srcName}
                                                    </span>
                                                )}
                                                {app.jobType && (
                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">
                                                        {app.jobType}
                                                    </span>
                                                )}
                                                {app.germanRequirement === 'required' && (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium">
                                                        🇩🇪 DE
                                                    </span>
                                                )}
                                                {(app.germanRequirement === 'optional' || app.germanRequirement === 'nice_to_have') && (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] font-medium">
                                                        🇩🇪 opt
                                                    </span>
                                                )}
                                                {app.yearsOfExperience && (
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        {app.yearsOfExperience}+ yrs
                                                    </span>
                                                )}
                                                {app.requiredSkills && app.requiredSkills.length > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        {app.requiredSkills.length} skill{app.requiredSkills.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons row */}
                                    <div className="flex items-center flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                                        {(app.customResumeUrl || app.generatedResumeUrl) && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const token = localStorage.getItem('auth_token');
                                                        const response = await fetch(
                                                            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/application-history/${app.id}/download/resume`,
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        );
                                                        if (!response.ok) throw new Error('Download failed');
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `resume_${app.company.replace(/\s+/g, '_')}.pdf`;
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Download error:', err);
                                                        alert('Failed to download resume');
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                            >
                                                <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                                                Resume
                                            </button>
                                        )}
                                        {(app.customCoverLetterUrl || app.generatedCoverLetterUrl) && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const token = localStorage.getItem('auth_token');
                                                        const response = await fetch(
                                                            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/application-history/${app.id}/download/cover-letter`,
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        );
                                                        if (!response.ok) throw new Error('Download failed');
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `cover_letter_${app.company.replace(/\s+/g, '_')}.pdf`;
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Download error:', err);
                                                        alert('Failed to download cover letter');
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                                            >
                                                <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                                                Cover Letter
                                            </button>
                                        )}
                                        {(app.applyLink || app.jobUrl || app.url) && (
                                            <a
                                                href={app.applyLink || app.jobUrl || app.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
                                            >
                                                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                                {app.applyLink ? 'Apply' : 'View Job'}
                                            </a>
                                        )}
                                        <button
                                            onClick={(e) => handleRegenerateDocuments(e, app)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                                            title="Regenerate resume and cover letter"
                                        >
                                            <ArrowPathIcon className="h-3.5 w-3.5" />
                                            Regenerate
                                        </button>
                                        <button
                                            onClick={(e) => handleArchiveApplication(e, app)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                                            title={app.isArchived ? 'Unarchive application' : 'Archive application'}
                                        >
                                            <ArchiveBoxIcon className="h-3.5 w-3.5" />
                                            {app.isArchived ? 'Unarchive' : 'Archive'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenReportModal(app);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded transition-colors ml-auto"
                                            title="Report this job"
                                        >
                                            <FlagIcon className="h-3.5 w-3.5" />
                                            Report
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteApplication(e, app)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-200 rounded transition-colors"
                                            title="Delete application and revert job to pending"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Load more trigger for infinite scroll */}
                <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                    {isLoadingMore && (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    )}
                </div>
            </div>

            <ReportModal
                isOpen={reportModalOpen}
                onClose={() => { setReportModalOpen(false); setJobToReport(null); }}
                onReport={handleReport}
                job={jobToReport}
            />
        </div>
    );
}
