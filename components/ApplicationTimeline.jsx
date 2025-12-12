'use client';

import PropTypes from 'prop-types';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const BASE_STAGES = [
  { name: 'Syncing', short: 'Sync' },
  { name: 'Being Applied', short: 'Apply' },
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
        short: i === 1 ? 'Int' : `Int${i}`,
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

  const getTextColor = (status) => {
    if (status === 'completed') return 'text-green-700';
    if (status === 'current') return 'text-blue-700 font-semibold';
    return 'text-gray-400';
  };

  // Determine sizing based on number of stages
  const stageCount = APPLICATION_STAGES.length;
  const iconSize = stageCount > 7 ? 'w-6 h-6' : stageCount > 5 ? 'w-7 h-7' : 'w-8 h-8';
  const textSize = stageCount > 7 ? 'text-[10px]' : stageCount > 5 ? 'text-xs' : 'text-xs';

  return (
    <div className="w-full">
      {/* Timeline stages */}
      <div className="flex flex-wrap items-start justify-start gap-x-1 gap-y-3">
        {APPLICATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isLast = index === APPLICATION_STAGES.length - 1;

          return (
            <div key={stage.name} className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                {/* Stage indicator */}
                <div className="relative flex-shrink-0 mb-1">
                  <div
                    className={`${iconSize} rounded-full border-2 flex items-center justify-center ${getStageColor(status)}`}
                  >
                    {status === 'completed' ? (
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    ) : status === 'current' ? (
                      <ClockIcon className="h-4 w-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                </div>

                {/* Stage label */}
                <span className={`${textSize} ${getTextColor(status)} text-center whitespace-nowrap`}>
                  {stage.short}
                </span>

                {/* Timestamp for current stage */}
                {status === 'current' && timestamps[stage.name] && (
                  <span className="text-[9px] text-gray-500 mt-0.5">
                    {new Date(timestamps[stage.name]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`h-0.5 w-3 flex-shrink-0 ${
                    status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal stage badge if applicable */}
      {isTerminalStage && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full">
          <span className={`text-xs font-medium ${
            currentStage === 'Accepted' ? 'text-green-700' :
            currentStage === 'Rejected' ? 'text-red-700' :
            'text-gray-700'
          }`}>
            {currentStage}
          </span>
          {timestamps[currentStage] && (
            <span className="text-[10px] text-gray-500">
              {new Date(timestamps[currentStage]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
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
