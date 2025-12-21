'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApplications, useUpdateApplicationStage } from '@/lib/hooks/useSWR';
import { BriefcaseIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import OfflineBanner from '@/components/OfflineBanner';

const APPLICATION_STAGES = [
    'Syncing',
    'CV Check',
    'Message Check',
    'Being Applied',
    'Applied',
    'Interview 1',
    'Next Interviews',
    'Offer',
    'Rejected',
    'Accepted',
    'Withdrawn',
    'Failed',
];

export default function ApplicationsClient({ initialData }) {
    const router = useRouter();
    const { updateStage } = useUpdateApplicationStage();
    const [searchQuery, setSearchQuery] = useState('');

    // Use SWR with initial data for faster first render
    const { applications, isLoading, isOffline, mutate } = useApplications(searchQuery, {
        fallbackData: searchQuery === '' ? initialData : undefined,
    });

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    // Only show loading when searching
    const showLoading = isLoading && searchQuery !== '';
    const hasApplications = applications.length > 0;
    const hasResults = applications.length > 0;

    const getStageColor = (stage) => {
        const colors = {
            'Syncing': 'bg-orange-100 text-orange-700',
            'CV Check': 'bg-indigo-100 text-indigo-700',
            'Message Check': 'bg-violet-100 text-violet-700',
            'Being Applied': 'bg-amber-100 text-amber-700',
            'Applied': 'bg-blue-100 text-blue-700',
            'Interview 1': 'bg-purple-100 text-purple-700',
            'Next Interviews': 'bg-fuchsia-100 text-fuchsia-700',
            'Offer': 'bg-green-100 text-green-700',
            'Rejected': 'bg-red-100 text-red-700',
            'Accepted': 'bg-emerald-100 text-emerald-700',
            'Withdrawn': 'bg-gray-100 text-gray-700',
            'Failed': 'bg-rose-100 text-rose-700',
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
                            const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&size=48&background=0D8ABC&color=fff&bold=true`;

                            return (
                                <div
                                    key={app.id}
                                    onClick={() => router.push(`/application/${app.id}`)}
                                    className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
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
                                                disabled={app.stage === 'Syncing'}
                                                className={`px-2 py-1 rounded-md text-xs font-medium border-0 ${app.stage === 'Syncing' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${getStageColor(app.stage)}`}
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

                                    <div className="mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600">Current Status:</span>
                                            <span className={`text-xs font-semibold`}>
                                                {app.stage}
                                            </span>
                                            {app.updatedAt && (
                                                <span className="text-xs text-gray-500">
                                                    • {new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            {app.skills && app.skills.length > 0 && (
                                                <span className="text-xs text-gray-500">
                                                    {app.skills.length} skill{app.skills.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
