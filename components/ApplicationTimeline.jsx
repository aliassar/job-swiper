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

  // Determine sizing based on number of stages for better responsiveness
  const stageCount = APPLICATION_STAGES.length;
  const iconSize = stageCount > 7 ? 'w-7 h-7' : stageCount > 5 ? 'w-8 h-8' : 'w-9 h-9';
  const textSize = stageCount > 7 ? 'text-[9px]' : stageCount > 5 ? 'text-[10px]' : 'text-xs';
  const gapSize = stageCount > 7 ? 'gap-x-0.5' : 'gap-x-1';
  
  // Calculate the vertical offset needed to center the line with the circle
  // For w-7 h-7 (28px), center is at 14px, so mt-[14px]
  // For w-8 h-8 (32px), center is at 16px, so mt-[16px]  
  // For w-9 h-9 (36px), center is at 18px, so mt-[18px]
  const lineOffset = stageCount > 7 ? 'mt-[14px]' : stageCount > 5 ? 'mt-[16px]' : 'mt-[18px]';

  return (
    <div className="w-full">
      {/* Timeline stages - refined for better visual hierarchy, full width */}
      <div className={`flex items-start justify-between ${gapSize} gap-y-4 w-full`}>
        {APPLICATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isLast = index === APPLICATION_STAGES.length - 1;

          return (
            <div key={stage.name} className="flex items-start gap-1">
              {/* Stage column with circle and labels */}
              <div className="flex flex-col items-center">
                {/* Stage indicator - enhanced with better shadows and sizing */}
                <div className="relative flex-shrink-0 mb-1.5">
                  <div
                    className={`${iconSize} rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(status)}`}
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

                {/* Stage label - improved typography */}
                <span className={`${textSize} ${getTextColor(status)} text-center whitespace-nowrap leading-tight`}>
                  {stage.short}
                </span>

                {/* Timestamp for completed and current stages - better positioned */}
                {(status === 'current' || status === 'completed') && timestamps[stage.name] && (
                  <span className="text-[8px] text-gray-500 mt-0.5 font-medium">
                    {new Date(timestamps[stage.name]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Connector line - aligned ONLY with circle center, not text */}
              {!isLast && (
                <div className={`flex-1 flex items-start ${lineOffset}`}>
                  <div
                    className={`h-0.5 w-full flex-shrink-0 transition-all ${getConnectorColor(status)}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal stage badge if applicable - refined design */}
      {isTerminalStage && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 border-2 rounded-lg shadow-sm">
          <span className={`text-xs font-bold ${
            currentStage === 'Accepted' ? 'text-green-700' :
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
  interviewCount: PropTypes.number,
};
