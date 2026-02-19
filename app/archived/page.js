'use client';

import { useState, useCallback } from 'react';
import { applicationsApi } from '@/lib/api';
import { ArchiveBoxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';
import useSWR from 'swr';

export default function ArchivedPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, mutate } = useSWR(
        ['archived-applications', searchQuery],
        () => applicationsApi.getArchivedApplications(searchQuery),
        { revalidateOnFocus: false }
    );

    const applications = data?.items || [];

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const handleUnarchive = useCallback(async (e, app) => {
        e.stopPropagation();
        try {
            await applicationsApi.archiveApplication(app.id);
            mutate();
        } catch (err) {
            console.error('Error unarchiving application:', err);
            alert('Failed to unarchive application');
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
                        Archived Applications
                    </h1>
                    <p className="text-sm text-gray-600">
                        Applications you&apos;ve archived
                    </p>
                </div>

                <div className="mb-4">
                    <SearchInput
                        placeholder="Search archived applications..."
                        onSearch={handleSearch}
                    />
                </div>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-600">Loading archived applications...</p>
                    </div>
                )}

                {!isLoading && applications.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No archived applications</h2>
                        <p className="text-gray-600">
                            Archive applications from the Application Status page to see them here.
                        </p>
                    </div>
                )}

                {applications.length > 0 && (
                    <div className="space-y-3">
                        {applications.map((app) => {
                            const logoUrl = app.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.company)}&size=48&background=0D8ABC&color=fff&bold=true`;

                            return (
                                <div
                                    key={app.id}
                                    className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow border border-gray-100 opacity-80"
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
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStageColor(app.stage)}`}>
                                            {app.stage}
                                        </span>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                Applied {new Date(app.createdAt || app.appliedAt || app.lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={(e) => handleUnarchive(e, app)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                                            title="Unarchive application"
                                        >
                                            <ArrowPathIcon className="h-3.5 w-3.5" />
                                            Unarchive
                                        </button>
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
