'use client';

import PropTypes from 'prop-types';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';

const APPLICATION_STAGES = [
  { name: 'Syncing', short: 'Sync' },
  { name: 'Being Applied', short: 'Applying' },
  { name: 'Applied', short: 'Applied' },
  { name: 'Phone Screen', short: 'Phone' },
  { name: 'Interview', short: 'Interview' },
  { name: 'Offer', short: 'Offer' },
];

const TERMINAL_STAGES = ['Rejected', 'Accepted', 'Withdrawn'];

export default function ApplicationTimeline({ currentStage, timestamps = {} }) {
  // Find the index of the current stage in the main stages
  const currentStageIndex = APPLICATION_STAGES.findIndex(stage => stage.name === currentStage);
  const isTerminalStage = TERMINAL_STAGES.includes(currentStage);

  const getStageStatus = (stage, index) => {
    if (stage.name === currentStage) return 'current';
    if (isTerminalStage) {
      // If we're in a terminal stage, all main stages are completed
      return 'completed';
    }
    if (currentStageIndex === -1) {
      // Current stage is not in main stages (might be terminal)
      return 'pending';
    }
    return index < currentStageIndex ? 'completed' : 'pending';
  };

  const getStageColor = (status) => {
    if (status === 'completed') return 'bg-green-500 border-green-500';
    if (status === 'current') return 'bg-blue-500 border-blue-500';
    return 'bg-gray-200 border-gray-300';
  };

  const getStageTextColor = (status) => {
    if (status === 'completed' || status === 'current') return 'text-gray-900 font-semibold';
    return 'text-gray-400';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      {/* Horizontal timeline for main stages */}
      <div className="relative flex items-start justify-between mb-8">
        {APPLICATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isLast = index === APPLICATION_STAGES.length - 1;

          return (
            <div key={stage.name} className="flex flex-col items-center flex-1 relative">
              {/* Horizontal line connector */}
              {!isLast && (
                <div
                  className={`absolute top-4 left-1/2 right-0 h-0.5 -translate-y-1/2 ${
                    status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                  style={{ width: 'calc(100% - 1rem)' }}
                />
              )}

              {/* Stage indicator */}
              <div className="relative z-10 flex-shrink-0 mb-2">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStageColor(status)}`}
                >
                  {status === 'completed' ? (
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  ) : status === 'current' ? (
                    <ClockIcon className="h-5 w-5 text-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                  )}
                </div>
              </div>

              {/* Stage content */}
              <div className="text-center max-w-[80px]">
                <p className={`text-xs font-medium ${getStageTextColor(status)} leading-tight`}>
                  {stage.short}
                </p>
                {status === 'current' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 mt-1">
                    Current
                  </span>
                )}
                {timestamps[stage.name] && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    {formatTimestamp(timestamps[stage.name])}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal stage indicator if applicable */}
      {isTerminalStage && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                currentStage === 'Accepted'
                  ? 'bg-emerald-500 border-emerald-500'
                  : currentStage === 'Rejected'
                  ? 'bg-red-500 border-red-500'
                  : 'bg-gray-500 border-gray-500'
              }`}
            >
              {currentStage === 'Accepted' ? (
                <CheckCircleIcon className="h-5 w-5 text-white" />
              ) : currentStage === 'Rejected' ? (
                <XCircleIcon className="h-5 w-5 text-white" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-white" />
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">
              {currentStage}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                Final
              </span>
            </p>
            {timestamps[currentStage] && (
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(timestamps[currentStage])}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ApplicationTimeline.propTypes = {
  currentStage: PropTypes.string.isRequired,
  timestamps: PropTypes.object,
};
