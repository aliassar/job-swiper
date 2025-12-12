'use client';

import PropTypes from 'prop-types';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';

const APPLICATION_STAGES = [
  { name: 'Syncing', description: 'Application being synced' },
  { name: 'Being Applied', description: 'Application in progress' },
  { name: 'Applied', description: 'Application submitted' },
  { name: 'Phone Screen', description: 'Initial phone screening' },
  { name: 'Interview', description: 'Interview scheduled' },
  { name: 'Offer', description: 'Offer received' },
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Main stages timeline */}
      <div className="relative">
        {APPLICATION_STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isLast = index === APPLICATION_STAGES.length - 1;

          return (
            <div key={stage.name} className="relative flex items-start gap-4 pb-8">
              {/* Vertical line connector */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                    status === 'completed' || (status === 'current' && index < APPLICATION_STAGES.length - 1)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Stage indicator */}
              <div className="relative z-10 flex-shrink-0">
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
              <div className="flex-1 pt-0.5">
                <h4 className={`text-sm font-medium ${getStageTextColor(status)}`}>
                  {stage.name}
                  {status === 'current' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                      Current
                    </span>
                  )}
                </h4>
                <p className={`text-xs mt-0.5 ${status === 'pending' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stage.description}
                </p>
                {timestamps[stage.name] && (
                  <p className="text-xs text-gray-500 mt-1">
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
        <div className="relative flex items-start gap-4 pt-2 border-t border-gray-200">
          <div className="relative z-10 flex-shrink-0">
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

          <div className="flex-1 pt-0.5">
            <h4 className="text-sm font-semibold text-gray-900">
              {currentStage}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                Final Status
              </span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentStage === 'Accepted' && 'Offer accepted'}
              {currentStage === 'Rejected' && 'Application not selected'}
              {currentStage === 'Withdrawn' && 'Application withdrawn'}
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
