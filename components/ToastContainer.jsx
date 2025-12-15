'use client';

import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/lib/hooks/useToast';

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${getToastStyles(toast.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getToastIcon(toast.type)}
          </div>
          <div className="flex-1 text-sm text-gray-800">
            {toast.message}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
