'use client';

import PropTypes from 'prop-types';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const TERMINAL_STAGES = ['Rejected', 'Accepted', 'Withdrawn'];

// Simplified stages - no more CV Check, Message Check, or Interview stages
const APPLICATION_STAGES = [
  { name: 'Being Applied', short: 'Being Applied' },
  { name: 'Applied', short: 'Applied' },
  { name: 'In Review', short: 'In Review' },
];

export default function ApplicationTimeline({
  currentStage,
  timestamps = {}
}) {
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
    if (status === 'completed') return 'bg-green-500 border-green-500 shadow-sm';
    if (status === 'current') return 'bg-blue-500 border-blue-500 shadow-md';
    return 'bg-gray-200 border-gray-300';
  };

  const getTextColor = (status) => {
    if (status === 'completed') return 'text-green-700 font-medium';
    if (status === 'current') return 'text-blue-700 font-bold';
    return 'text-gray-400';
  };

  const getConnectorColor = (status) => {
    if (status === 'completed') return 'bg-green-500';
    return 'bg-gray-200';
  };

  return (
    <div className="w-full">
      {/* Timeline stages */}
      <div className="flex items-start justify-between gap-x-1 gap-y-4 w-full">
        {APPLICATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isLast = index === APPLICATION_STAGES.length - 1;

          return (
            <div key={stage.name} className="flex items-start gap-1">
              {/* Stage column with circle and labels */}
              <div className="flex flex-col items-center">
                {/* Stage indicator */}
                <div className="relative flex-shrink-0 mb-1.5">
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(status)}`}
                  >
                    {status === 'completed' ? (
                      <CheckCircleIcon className="h-4 w-4 text-white drop-shadow-sm" />
                    ) : status === 'current' ? (
                      <ClockIcon className="h-4 w-4 text-white drop-shadow-sm" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    )}
                  </div>

                  {/* Current stage badge */}
                  {status === 'current' && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-full whitespace-nowrap shadow-sm">
                      Current
                    </div>
                  )}
                </div>

                {/* Stage label */}
                <span className={`text-xs ${getTextColor(status)} text-center whitespace-nowrap leading-tight`}>
                  {stage.short}
                </span>

                {/* Timestamp for completed and current stages */}
                {(status === 'current' || status === 'completed') && timestamps[stage.name] && (
                  <span className="text-[8px] text-gray-500 mt-0.5 font-medium">
                    {new Date(timestamps[stage.name]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 flex items-start mt-[18px]">
                  <div
                    className={`h-0.5 w-full flex-shrink-0 transition-all ${getConnectorColor(status)}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal stage badge if applicable */}
      {isTerminalStage && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 border-2 rounded-lg shadow-sm">
          <span className={`text-xs font-bold ${currentStage === 'Accepted' ? 'text-green-700' :
              currentStage === 'Rejected' ? 'text-red-700' :
                'text-gray-700'
            }`}>
            {currentStage}
          </span>
          {timestamps[currentStage] && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] text-gray-600 font-medium">
                {new Date(timestamps[currentStage]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

ApplicationTimeline.propTypes = {
  currentStage: PropTypes.string.isRequired,
  timestamps: PropTypes.object,
};

