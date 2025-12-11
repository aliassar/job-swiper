'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Toast = ({ id, type = 'info', message, onDismiss, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${backgrounds[type]} border rounded-lg shadow-lg p-4 mb-3 max-w-sm w-full pointer-events-auto`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium">
            {message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={onDismiss}
            duration={toast.duration}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
