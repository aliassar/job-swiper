'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput } from '@/lib/utils';

export default function ReportModal({ isOpen, onClose, onReport, job }) {
  const [blockCompany, setBlockCompany] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  if (!job) return null;

  const reasons = [
    { id: 'fake', label: 'Fake', description: 'This job posting appears to be fake' },
    { id: 'not_interested', label: 'Not Interested', description: 'I\'m not interested in this type of job' },
    { id: 'dont_recommend_company', label: 'Block Company', description: 'Don\'t show any jobs from this company' }
  ];

  const handleReport = (reason) => {
    // Best Practice 14: Sanitize input before reporting
    const sanitizedReason = sanitizeInput(reason, 100);
    // For 'dont_recommend_company', blockCompany is always true
    // For other reasons, use the checkbox state
    const shouldBlockCompany = reason === 'dont_recommend_company' ? true : blockCompany;
    onReport(sanitizedReason, shouldBlockCompany);
    // Reset state
    setBlockCompany(false);
    setSelectedReason(null);
    onClose();
  };

  const handleReasonClick = (reason) => {
    if (reason.id === 'dont_recommend_company') {
      // Directly report with company block
      handleReport(reason.id);
    } else {
      // Select reason and show checkbox option
      setSelectedReason(reason);
    }
  };

  const handleConfirmReport = () => {
    if (selectedReason) {
      handleReport(selectedReason.id);
    }
  };

  const handleBack = () => {
    setSelectedReason(null);
    setBlockCompany(false);
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
            className="fixed inset-0 bg-black/50 z-[55]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-[5%] top-[5%] w-[90%] max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-[60] p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedReason ? 'Confirm Report' : 'Report Job'}
              </h2>
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

            {!selectedReason ? (
              <>
                {/* Reason Options */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Why are you reporting this job?
                  </p>
                  {reasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => handleReasonClick(reason)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${reason.id === 'dont_recommend_company'
                          ? 'border-red-200 hover:border-red-500 hover:bg-red-50'
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                    >
                      <div className={`font-semibold mb-1 ${reason.id === 'dont_recommend_company'
                          ? 'text-red-700 group-hover:text-red-800'
                          : 'text-gray-900 group-hover:text-blue-700'
                        }`}>
                        {reason.id === 'dont_recommend_company' && (
                          <NoSymbolIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                        )}
                        {reason.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reason.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Confirmation step with block option */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Reason: {selectedReason.label}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReason.description}
                    </p>
                  </div>

                  {/* Block company checkbox */}
                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blockCompany}
                      onChange={(e) => setBlockCompany(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <NoSymbolIcon className="h-4 w-4 text-red-600" />
                        Also block this company
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Don't show any jobs from <strong>{job.company}</strong> in the future
                      </p>
                    </div>
                  </label>

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmReport}
                      className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors font-medium text-white"
                    >
                      Report
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Cancel Button - only show on first step */}
            {!selectedReason && (
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 px-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

ReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReport: PropTypes.func.isRequired,
  job: PropTypes.shape({
    id: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    position: PropTypes.string.isRequired,
  }),
};
