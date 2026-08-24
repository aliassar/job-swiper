'use client';

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DocumentArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { resolveGenerationState, formatElapsed, GENERATION_TIMEOUT_MS } from '@/lib/generationState';

/**
 * Resume / Cover Letter controls, reflecting generation state.
 *
 *   ready      -> the two download buttons
 *   generating -> "Generating..." with a spinner, disabled
 *   failed     -> "Generation failed", with the error in the tooltip
 *   idle       -> nothing (never requested, or outside the document pool)
 *
 * A ticking clock re-derives the state so a stalled run turns into a failure
 * on screen at the fifteen-minute mark rather than spinning indefinitely.
 */
export default function DocumentButtons({
  generation,
  hasResume,
  hasCoverLetter,
  onDownloadResume,
  onDownloadCoverLetter,
  onRetry,
  compact = false,
}) {
  const [now, setNow] = useState(() => Date.now());

  const resolved = resolveGenerationState(generation, now);

  // Only tick while something is actually in flight, so idle cards do no work.
  useEffect(() => {
    if (resolved.state !== 'generating') return undefined;
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, [resolved.state]);

  const size = compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs';
  const icon = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  if (resolved.state === 'generating') {
    const elapsed = formatElapsed(resolved.startedAt, now);
    const remaining = resolved.startedAt
      ? Math.max(0, Math.ceil((GENERATION_TIMEOUT_MS - (now - new Date(resolved.startedAt).getTime())) / 60000))
      : null;
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${size} font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg cursor-default`}
        title={remaining !== null
          ? `Generating resume and cover letter — ${elapsed} elapsed, times out in ~${remaining} min`
          : 'Generating resume and cover letter'}
        aria-live="polite"
      >
        <svg className={`animate-spin ${icon}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Generating…
      </span>
    );
  }

  if (resolved.state === 'failed') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${size} font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg`}
        // The full reason can be long; the tooltip carries it rather than
        // stretching the card.
        title={resolved.error || 'Generation failed'}
      >
        <ExclamationTriangleIcon className={icon} aria-hidden="true" />
        Generation failed
        {onRetry && (
          <button
            onClick={(e) => { e.stopPropagation(); onRetry(); }}
            className="ml-1 underline underline-offset-2 hover:text-red-900"
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  if (resolved.state === 'idle') return null;

  return (
    <>
      {hasResume && (
        <button
          onClick={onDownloadResume}
          className={`inline-flex items-center gap-1.5 ${size} font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors`}
          title="Download Resume"
        >
          <DocumentArrowDownIcon className={icon} />
          Resume
        </button>
      )}
      {hasCoverLetter && (
        <button
          onClick={onDownloadCoverLetter}
          className={`inline-flex items-center gap-1.5 ${size} font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors`}
          title="Download Cover Letter"
        >
          <DocumentArrowDownIcon className={icon} />
          Cover Letter
        </button>
      )}
    </>
  );
}

DocumentButtons.propTypes = {
  generation: PropTypes.shape({
    state: PropTypes.oneOf(['ready', 'generating', 'failed', 'idle']),
    startedAt: PropTypes.string,
    error: PropTypes.string,
  }),
  hasResume: PropTypes.bool,
  hasCoverLetter: PropTypes.bool,
  onDownloadResume: PropTypes.func,
  onDownloadCoverLetter: PropTypes.func,
  onRetry: PropTypes.func,
  compact: PropTypes.bool,
};
