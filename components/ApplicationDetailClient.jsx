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
    CheckIcon,
    MapPinIcon,
    CalendarDaysIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    ClockIcon,
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
    'Being Applied': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    'Applied': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    'In Review': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    'Accepted': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'Rejected': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    'Withdrawn': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
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

    const app = data?.data || data || null;
    const job = app?.job || {};

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
        if (!confirm('Delete this application? The job will be reverted to pending.')) return;
        try {
            await applicationsApi.deleteApplication(applicationId);
            router.push('/applications');
        } catch (err) {
            console.error('Failed to delete:', err);
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

    const handleRegenerate = useCallback(async () => {
        try {
            await applicationsApi.regenerateDocuments(applicationId);
            mutate();
        } catch (err) {
            console.error('Failed to regenerate:', err);
        }
    }, [applicationId, mutate]);

    const downloadFile = useCallback(async (type) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/applications/${applicationId}/download/${type}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const label = type === 'resume' ? 'CV' : 'Cover Letter';
            a.download = `Ali Haji Amou Asar ${label} - ${job.company} (${job.position}).pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
        }
    }, [applicationId, job.company, job.position]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !app) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <p className="text-4xl mb-3">😕</p>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Application not found</h2>
                <button onClick={() => router.push('/applications')} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                    Back
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
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

    const hasDocuments = (app.customResumeUrl || app.generatedResume?.fileUrl) || (app.customCoverLetterUrl || app.generatedCoverLetter?.fileUrl);
    const hasInfoTags = job.salary || job.jobType || job.germanRequirement || job.yearsOfExperience;

    return (
        <div className="h-full overflow-y-auto bg-gray-50/70">
            <div className="max-w-lg mx-auto">
                {/* Minimal sticky back bar */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/applications')}
                        className="p-1.5 -ml-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-500">Application Details</span>
                    <div className="flex-1" />
                    {/* Action icons in header */}
                    <button onClick={handleRegenerate} className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Regenerate Docs">
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button onClick={handleArchive} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title={app.isArchived ? 'Unarchive' : 'Archive'}>
                        <ArchiveBoxIcon className="h-4 w-4" />
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {/* Hero section — Job title + company + stage */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <div className="flex items-start gap-3.5">
                            <img src={logoUrl} alt={job.company} className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                {/* Job position — primary */}
                                <h1 className="text-[15px] font-bold text-gray-900 leading-snug">{job.position || 'Position'}</h1>
                                {/* Company — secondary */}
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-sm text-gray-600">{job.company || 'Company'}</span>
                                    {source && (
                                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${source.className}`}>{source.label}</span>
                                    )}
                                </div>
                                {/* Location */}
                                {job.location && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <MapPinIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-400">{job.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stage selector + dates row */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                            <select
                                value={stage}
                                onChange={(e) => handleStageChange(e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                                {APPLICATION_STAGES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400 justify-end">
                                {app.appliedAt && (
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDaysIcon className="h-3 w-3" />
                                        Applied {fmtDate(app.appliedAt)}
                                    </span>
                                )}
                                {job.postedDate && (
                                    <span className="inline-flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        Posted {fmtDate(job.postedDate)}
                                    </span>
                                )}
                                {app.createdAt && (!app.appliedAt || fmtDate(app.createdAt) !== fmtDate(app.appliedAt)) && (
                                    <span>Applied {fmtDate(app.createdAt)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick info tags */}
                    {hasInfoTags && (
                        <div className="flex flex-wrap gap-1.5">
                            {job.salary && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[11px] font-medium">
                                    <CurrencyDollarIcon className="h-3 w-3" /> {job.salary}
                                </span>
                            )}
                            {job.jobType && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[11px] font-medium">
                                    <BriefcaseIcon className="h-3 w-3" /> {job.jobType}
                                </span>
                            )}
                            {job.germanRequirement === 'required' && <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[11px] font-medium">🇩🇪 Required</span>}
                            {(job.germanRequirement === 'optional' || job.germanRequirement === 'nice_to_have') && <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-[11px] font-medium">🇩🇪 Preferred</span>}
                            {job.yearsOfExperience && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-medium">{job.yearsOfExperience}+ yr exp</span>}
                        </div>
                    )}

                    {/* Documents & Links */}
                    {(hasDocuments || job.applyLink || job.jobUrl) && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Documents & Links</p>
                            <div className="flex flex-wrap gap-2">
                                {(app.customResumeUrl || app.generatedResume?.fileUrl) && (
                                    <button onClick={() => downloadFile('resume')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                        <DocumentArrowDownIcon className="h-3.5 w-3.5" /> Resume
                                    </button>
                                )}
                                {(app.customCoverLetterUrl || app.generatedCoverLetter?.fileUrl) && (
                                    <button onClick={() => downloadFile('cover-letter')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                                        <DocumentArrowDownIcon className="h-3.5 w-3.5" /> Cover Letter
                                    </button>
                                )}
                                {(job.applyLink || job.jobUrl) && (
                                    <a href={job.applyLink || job.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" /> {job.applyLink ? 'Apply Link' : 'Job Posting'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {(requiredSkills.length > 0 || optionalSkills.length > 0) && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {requiredSkills.map((s, i) => (
                                    <span key={`r-${i}`} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium">{s}</span>
                                ))}
                                {optionalSkills.map((s, i) => (
                                    <span key={`o-${i}`} className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-medium">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {description && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Description</p>
                            <div className="relative">
                                <div
                                    className={`text-[13px] text-gray-600 leading-[1.75] prose prose-sm prose-gray max-w-none
                                        prose-headings:text-gray-800 prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
                                        prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1
                                        prose-strong:text-gray-700 prose-a:text-blue-600
                                        overflow-hidden transition-all duration-300 ${!descExpanded && hasLongDescription ? 'max-h-48' : ''}`}
                                    style={!descExpanded && hasLongDescription ? {
                                        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                                    } : undefined}
                                >
                                    <ReactMarkdown>{description}</ReactMarkdown>
                                </div>
                                {hasLongDescription && (
                                    <button
                                        onClick={() => setDescExpanded(!descExpanded)}
                                        className="mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        {descExpanded ? '↑ Show less' : '↓ Show more'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                            {notesSaving && <span className="text-[10px] text-gray-400 animate-pulse">Saving...</span>}
                            {notesSaved && !notesSaving && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium">
                                    <CheckIcon className="h-2.5 w-2.5" /> Saved
                                </span>
                            )}
                        </div>
                        <textarea
                            value={notes}
                            onChange={handleNotesChange}
                            onBlur={handleNotesBlur}
                            placeholder="Add notes..."
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-50/60 border border-gray-150 rounded-xl text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300 transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
