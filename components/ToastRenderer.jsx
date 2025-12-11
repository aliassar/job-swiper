'use client';

import { useToast } from '@/context/ToastContext';
import ToastContainer from './Toast';

export default function ToastRenderer() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onDismiss={removeToast} />;
}
