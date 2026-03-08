'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import { applicationsApi } from '@/lib/api';
import {
    ArrowLeftIcon,
    DocumentArrowDownIcon,
    ArrowTopRightOnSquareIcon,
    ArrowPathIcon,
    ArchiveBoxIcon,
    TrashIcon,
    BookmarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

const APPLICATION_STAGES = [
    'Being Applied',
    'Applied',
    'In Review',
    'Accepted',
    'Rejected',
    'Withdrawn',
];

const stageColors = {
    'Being Applied': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Applied': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'In Review': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    'Accepted': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Rejected': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    'Withdrawn': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};

const sourceConfig = {
    indeed: { label: 'Indeed', className: 'bg-blue-600 text-white' },
    linkedin: { label: 'LinkedIn', className: 'bg-sky-600 text-white' },
    glassdoor: { label: 'Glassdoor', className: 'bg-green-600 text-white' },
    xing: { label: 'Xing', className: 'bg-orange-500 text-white' },
};

export default function ApplicationDetailClient({ applicationId }) {
    const router = useRouter();
    const [descExpanded, setDescExpanded] = useState(false);
    const [notes, setNotes] = useState('');
    const [notesSaving, setNotesSaving] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const notesTimerRef = useRef(null);
    const initialNotesRef = useRef(null);

    const { data, error, isLoading, mutate } = useSWR(
        `application-detail-${applicationId}`,
        () => applicationsApi.getApplication(applicationId),
        { revalidateOnFocus: false }
    );

    // The API wraps in { data: { ... } } — unwrap
    const app = data?.data || data || null;
    const job = app?.job || {};

    // Sync notes from server on first load
    useEffect(() => {
        if (app && initialNotesRef.current === null) {
            const serverNotes = app.notes || '';
            setNotes(serverNotes);
            initialNotesRef.current = serverNotes;
        }
    }, [app]);

    const saveNotes = useCallback(async (value) => {
        if (value === initialNotesRef.current) return;
        setNotesSaving(true);
        try {
            await applicationsApi.updateNotes(applicationId, value);
            initialNotesRef.current = value;
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save notes:', err);
        } finally {
            setNotesSaving(false);
        }
    }, [applicationId]);

    const handleNotesChange = useCallback((e) => {
        const value = e.target.value;
        setNotes(value);
        // Auto-save after 1s of inactivity
        if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
        notesTimerRef.current = setTimeout(() => saveNotes(value), 1000);
    }, [saveNotes]);

    const handleNotesBlur = useCallback(() => {
        if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
        saveNotes(notes);
    }, [notes, saveNotes]);

    const handleStageChange = useCallback(async (newStage) => {
        try {
            await applicationsApi.updateStage(applicationId, newStage);
            mutate();
        } catch (err) {
            console.error('Failed to update stage:', err);
        }
    }, [applicationId, mutate]);

    const handleDelete = useCallback(async () => {
        if (!confirm(`Delete this application? The job will be reverted to pending.`)) return;
        try {
            await applicationsApi.deleteApplication(applicationId);
            router.push('/applications');
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Failed to delete application');
        }
    }, [applicationId, router]);

    const handleArchive = useCallback(async () => {
        try {
            await applicationsApi.archiveApplication(applicationId);
            mutate();
        } catch (err) {
            console.error('Failed to archive:', err);
        }
    }, [applicationId, mutate]);

    const handleSaveForLater = useCallback(async () => {
        try {
            await applicationsApi.saveForLater(applicationId);
            mutate();
        } catch (err) {
            console.error('Failed to save for later:', err);
        }
    }, [applicationId, mutate]);

    const handleRegenerate = useCallback(async () => {
        try {
            await applicationsApi.regenerateDocuments(applicationId);
            mutate();
        } catch (err) {
            console.error('Failed to regenerate:', err);
            alert('Failed to trigger document regeneration');
        }
    }, [applicationId, mutate]);

    const getRelativeTime = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return '1 day ago';
        return `${diffInDays} days ago`;
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !app) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Application not found</h2>
                <button onClick={() => router.push('/applications')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                    Back to Applications
                </button>
            </div>
        );
    }

    const stage = app.stage || 'Being Applied';
    const colors = stageColors[stage] || stageColors['Being Applied'];
    const logoUrl = job.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'N/A')}&size=80&background=0D8ABC&color=fff&bold=true`;
    const source = job.srcName ? sourceConfig[job.srcName.toLowerCase()] : null;
    const requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
    const optionalSkills = Array.isArray(job.optionalSkills) ? job.optionalSkills : [];
    const description = job.description || '';
    const hasLongDescription = description.length > 400;

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-lg mx-auto pb-8">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-5 pt-5 pb-6 relative">
                    <button
                        onClick={() => router.push('/applications')}
                        className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Applications
                    </button>

                    <div className="flex items-start gap-4">
                        <img
                            src={logoUrl}
                            alt={`${job.company} logo`}
                            className="w-16 h-16 rounded-2xl shadow-lg bg-white flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h1 className="text-xl font-bold text-white">{job.company || 'Unknown Company'}</h1>
                                {source && (
                                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${source.className}`}>
                                        {source.label}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-base text-blue-100 font-medium mb-1">{job.position || 'Unknown Position'}</h2>
                            <p className="text-sm text-blue-200">{job.location || ''}</p>
                        </div>
                    </div>
                </div>

                <div className="px-5 space-y-5 -mt-3">
                    {/* Status card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>
                                <span className="text-sm font-semibold text-gray-900">Status</span>
                            </div>
                            <select
                                value={stage}
                                onChange={(e) => handleStageChange(e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 cursor-pointer ${colors.bg} ${colors.text}`}
                            >
                                {APPLICATION_STAGES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            {app.appliedAt && (
                                <span>✅ Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                            {job.postedDate && (
                                <span>📅 Posted {new Date(job.postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                            {app.createdAt && (
                                <span>➕ Added {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                        </div>
                    </div>

                    {/* Info pills */}
                    {(job.salary || job.jobType || job.germanRequirement || job.yearsOfExperience) && (
                        <div className="flex flex-wrap gap-2">
                            {job.salary && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                                    <span className="text-base">💰</span>
                                    <span className="text-sm font-semibold text-green-700">{job.salary}</span>
                                </div>
                            )}
                            {job.jobType && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                                    <span className="text-base">💼</span>
                                    <span className="text-sm font-semibold text-purple-700">{job.jobType}</span>
                                </div>
                            )}
                            {job.germanRequirement === 'required' && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                                    <span className="text-base">🇩🇪</span>
                                    <span className="text-sm font-semibold text-red-700">German Required</span>
                                </div>
                            )}
                            {(job.germanRequirement === 'optional' || job.germanRequirement === 'nice_to_have') && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <span className="text-base">🇩🇪</span>
                                    <span className="text-sm font-semibold text-yellow-700">German Preferred</span>
                                </div>
                            )}
                            {job.yearsOfExperience && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                                    <span className="text-sm font-semibold text-blue-700">{job.yearsOfExperience}+ years exp</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills */}
                    {(requiredSkills.length > 0 || optionalSkills.length > 0) && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {requiredSkills.map((skill, i) => (
                                    <span key={`r-${i}`} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {skill}
                                    </span>
                                ))}
                                {optionalSkills.map((skill, i) => (
                                    <span key={`o-${i}`} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {description && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                            <div
                                className={`text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none overflow-hidden transition-all duration-300 ${!descExpanded && hasLongDescription ? 'max-h-36' : ''}`}
                                style={!descExpanded && hasLongDescription ? { WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' } : undefined}
                            >
                                <ReactMarkdown>{description}</ReactMarkdown>
                            </div>
                            {hasLongDescription && (
                                <button
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {descExpanded ? 'Show less' : 'Show more'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
                            {notesSaving && (
                                <span className="text-[11px] text-gray-400 animate-pulse">Saving...</span>
                            )}
                            {notesSaved && !notesSaving && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                                    <CheckIcon className="h-3 w-3" />
                                    Saved
                                </span>
                            )}
                        </div>
                        <textarea
                            value={notes}
                            onChange={handleNotesChange}
                            onBlur={handleNotesBlur}
                            placeholder="Add notes about this application..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Actions</h3>

                        <div className="flex flex-wrap gap-2">
                            {(app.customResumeUrl || app.generatedResume?.fileUrl) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem('auth_token');
                                            const response = await fetch(
                                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/applications/${applicationId}/download/resume`,
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            if (!response.ok) throw new Error('Download failed');
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `Ali Haji Amou Asar CV - ${job.company} (${job.position}).pdf`;
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error('Download error:', err);
                                            alert('Failed to download resume');
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                >
                                    <DocumentArrowDownIcon className="h-4 w-4" />
                                    Resume
                                </button>
                            )}
                            {(app.customCoverLetterUrl || app.generatedCoverLetter?.fileUrl) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem('auth_token');
                                            const response = await fetch(
                                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/applications/${applicationId}/download/cover-letter`,
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            if (!response.ok) throw new Error('Download failed');
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `Ali Haji Amou Asar Cover Letter - ${job.company} (${job.position}).pdf`;
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error('Download error:', err);
                                            alert('Failed to download cover letter');
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                                >
                                    <DocumentArrowDownIcon className="h-4 w-4" />
                                    Cover Letter
                                </button>
                            )}
                            {(job.applyLink || job.jobUrl) && (
                                <a
                                    href={job.applyLink || job.jobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                                >
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                    {job.applyLink ? 'Apply' : 'View Job'}
                                </a>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
                            <button onClick={handleRegenerate} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                Regenerate Docs
                            </button>
                            <button onClick={handleArchive} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                                <ArchiveBoxIcon className="h-3.5 w-3.5" />
                                {app.isArchived ? 'Unarchive' : 'Archive'}
                            </button>
                            <button onClick={handleSaveForLater} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                <BookmarkIcon className="h-3.5 w-3.5" />
                                Save for Later
                            </button>
                            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                <TrashIcon className="h-3.5 w-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
