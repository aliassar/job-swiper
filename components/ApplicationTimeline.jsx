'use client';

import PropTypes from 'prop-types';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';

const BASE_STAGES = [
  { name: 'Syncing', short: 'Sync' },
  { name: 'Being Applied', short: 'Applying' },
  { name: 'Applied', short: 'Applied' },
  { name: 'Phone Screen', short: 'Phone' },
];

const TERMINAL_STAGES = ['Rejected', 'Accepted', 'Withdrawn'];

export default function ApplicationTimeline({ currentStage, timestamps = {}, interviewCount = 1 }) {
  // Build dynamic stages with multiple interviews
  const buildStages = () => {
    const stages = [...BASE_STAGES];
    
    // Add interview stages dynamically based on count
    for (let i = 1; i <= Math.max(interviewCount, 1); i++) {
      stages.push({
        name: i === 1 ? 'Interview' : `Interview ${i}`,
        short: i === 1 ? 'Interview' : `Int ${i}`,
      });
    }
    
    // Add Offer stage
    stages.push({ name: 'Offer', short: 'Offer' });
    
    return stages;
  };

  const APPLICATION_STAGES = buildStages();
  
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

  // Calculate responsive size based on number of stages
  const stageCount = APPLICATION_STAGES.length;
  const getResponsiveSize = () => {
    if (stageCount <= 6) return { iconSize: 'w-8 h-8', textSize: 'text-xs', maxWidth: 'max-w-[80px]' };
    if (stageCount <= 8) return { iconSize: 'w-7 h-7', textSize: 'text-[11px]', maxWidth: 'max-w-[70px]' };
    return { iconSize: 'w-6 h-6', textSize: 'text-[10px]', maxWidth: 'max-w-[60px]' };
  };

  const { iconSize, textSize, maxWidth } = getResponsiveSize();

  return (
    <div className="w-full">
      {/* Horizontal timeline for main stages - wraps to next line if overflow */}
      <div className="relative flex items-start flex-wrap gap-x-2 gap-y-4 mb-6">
        {APPLICATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isLast = index === APPLICATION_STAGES.length - 1;

          return (
            <div key={stage.name} className="flex flex-col items-center relative min-w-[50px]">
              {/* Horizontal line connector - only for same row */}
              {!isLast && (
                <div
                  className={`absolute top-3 left-full h-0.5 w-2 ${
                    status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Stage indicator */}
              <div className="relative flex-shrink-0 mb-1">
                <div
                  className={`${iconSize} rounded-full border-2 flex items-center justify-center ${getStageColor(status)}`}
                >
                  {status === 'completed' ? (
                    <CheckCircleIcon className="h-3 w-3 text-white" />
                  ) : status === 'current' ? (
                    <ClockIcon className="h-3 w-3 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                </div>
              </div>

              {/* Stage content */}
              <div className={`text-center ${maxWidth}`}>
                <p className={`${textSize} font-medium ${getStageTextColor(status)} leading-tight whitespace-nowrap`}>
                  {stage.short}
                </p>
                {status === 'current' && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] bg-blue-100 text-blue-700 mt-0.5">
                    Now
                  </span>
                )}
                {timestamps[stage.name] && (
                  <p className="text-[9px] text-gray-500 mt-0.5">
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
  interviewCount: PropTypes.number,
};
