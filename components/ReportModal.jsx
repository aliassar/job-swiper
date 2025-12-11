'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportModal({ isOpen, onClose, onReport, job }) {
  if (!job) return null;

  const reasons = [
    { id: 'fake', label: 'Fake Job', description: 'This job posting appears to be fraudulent' },
    { id: 'not_mine', label: 'Not My Field', description: 'This job doesn\'t match my interests' },
    { id: 'other', label: 'Other', description: 'Other reason for reporting' }
  ];

  const handleReport = (reason) => {
    onReport(reason);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-50 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Report Job</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Job Info */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{job.position}</span> at {job.company}
              </p>
            </div>

            {/* Reason Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Why are you reporting this job?
              </p>
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => handleReport(reason.id)}
                  className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 mb-1">
                    {reason.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {reason.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 px-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
