'use client';

import { useState, useCallback } from 'react';
import { applicationsApi } from '@/lib/api';
import { ArchiveBoxIcon, ArrowPathIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import SearchInput from '@/components/SearchInput';
import useSWR from 'swr';

export default function ArchivedPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('saved-for-later');

    const { data: archivedData, isLoading: archivedLoading, mutate: mutateArchived } = useSWR(
        ['archived-applications', searchQuery],
        () => applicationsApi.getArchivedApplications(searchQuery),
        { revalidateOnFocus: false }
    );

    const { data: savedData, isLoading: savedLoading, mutate: mutateSaved } = useSWR(
        ['saved-for-later-applications', searchQuery],
        () => applicationsApi.getSavedForLaterApplications(searchQuery),
        { revalidateOnFocus: false }
    );

    const archivedApps = archivedData?.items || [];
    const savedApps = savedData?.items || [];
    const isLoading = activeTab === 'saved-for-later' ? savedLoading : archivedLoading;
    const displayedApps = activeTab === 'saved-for-later' ? savedApps : archivedApps;

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const handleUnarchive = useCallback(async (e, app) => {
        e.stopPropagation();
        try {
            await applicationsApi.archiveApplication(app.id);
            mutateArchived();
        } catch (err) {
            console.error('Error unarchiving application:', err);
            alert('Failed to unarchive application');
        }
    }, [mutateArchived]);

    const handleRestoreSaved = useCallback(async (e, app) => {
        e.stopPropagation();
        try {
            await applicationsApi.saveForLater(app.id);
            mutateSaved();
        } catch (err) {
            console.error('Error restoring application:', err);
            alert('Failed to restore application');
        }
    }, [mutateSaved]);

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
                        Saved & Archived
                    </h1>
                    <p className="text-sm text-gray-600">
                        Applications you&apos;ve saved for later or archived
                    </p>
                </div>

                <div className="mb-4">
                    <SearchInput
                        placeholder="Search applications..."
                        onSearch={handleSearch}
                    />
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('saved-for-later')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'saved-for-later'
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <BookmarkIcon className="h-4 w-4" />
                        Saved
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'saved-for-later'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {savedApps.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'archived'
                                ? 'bg-white text-amber-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <ArchiveBoxIcon className="h-4 w-4" />
                        Archived
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'archived'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {archivedApps.length}
                        </span>
                    </button>
                </div>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-600">Loading applications...</p>
                    </div>
                )}

                {!isLoading && displayedApps.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
                        <div className="text-6xl mb-4">{activeTab === 'saved-for-later' ? '🔖' : '📦'}</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {activeTab === 'saved-for-later' ? 'No saved applications' : 'No archived applications'}
                        </h2>
                        <p className="text-gray-600">
                            {activeTab === 'saved-for-later'
                                ? 'Save applications for later from the Application Status page.'
                                : 'Archive applications from the Application Status page to see them here.'}
                        </p>
                    </div>
                )}

                {displayedApps.length > 0 && (
                    <div className="space-y-3">
                        {displayedApps.map((app) => {
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
                                            <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                                                {app.position}
                                            </h3>
                                            <p className="text-xs text-gray-600 mt-0.5">{app.company} • {app.location}</p>
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
                                        {activeTab === 'saved-for-later' ? (
                                            <button
                                                onClick={(e) => handleRestoreSaved(e, app)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                title="Restore to applications"
                                            >
                                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                                Restore
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => handleUnarchive(e, app)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                                                title="Unarchive application"
                                            >
                                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                                Unarchive
                                            </button>
                                        )}
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
