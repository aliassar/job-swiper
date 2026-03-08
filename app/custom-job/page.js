'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { customJobApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomJobPage() {
    const { status } = useAuth();
    const router = useRouter();
    const [text, setText] = useState('');
    const [applyLink, setApplyLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!text.trim() || !applyLink.trim()) {
            setFeedback({ type: 'error', message: 'Both fields are required.' });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            await customJobApi.submitJob(text, applyLink);
            setFeedback({ type: 'success', message: 'Custom job submitted successfully!' });
            setText('');
            setApplyLink('');
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.message || 'Failed to submit. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto pt-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Submit Custom Job
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Paste a job posting you found and enter the apply link to process it.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Job Text */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
                        <label
                            htmlFor="job-text"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            Job Posting Text
                        </label>
                        <textarea
                            id="job-text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste the full job description here, including all details like company name, position, requirements, etc."
                            rows={12}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all resize-y text-sm leading-relaxed"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                            {text.length > 0 ? `${text.length} characters` : 'Include all relevant details from the posting'}
                        </p>
                    </div>

                    {/* Apply Link */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
                        <label
                            htmlFor="apply-link"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            Apply Link
                        </label>
                        <input
                            id="apply-link"
                            type="url"
                            value={applyLink}
                            onChange={(e) => setApplyLink(e.target.value)}
                            placeholder="https://example.com/apply"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm"
                        />
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                            >
                                {feedback.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !text.trim() || !applyLink.trim()}
                        className="w-full py-3.5 rounded-xl text-white font-semibold text-base
              bg-gradient-to-r from-blue-500 to-indigo-600
              hover:from-blue-600 hover:to-indigo-700
              disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
              shadow-md hover:shadow-lg disabled:shadow-none
              transition-all duration-200
              active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Submitting...
                            </span>
                        ) : (
                            'Submit Custom Job'
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
