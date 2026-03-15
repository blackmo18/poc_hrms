'use client';

import React from 'react';
import { CheckCircleIcon, AlertCircleIcon, XIcon } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success-500 text-white border-l-4 border-success-600';
      case 'error':
        return 'bg-error-500 text-white border-l-4 border-error-600';
      case 'warning':
        return 'bg-warning-500 text-white border-l-4 border-warning-600';
      case 'info':
        return 'bg-brand-500 text-white border-l-4 border-brand-600';
      default:
        return 'bg-gray-500 text-white border-l-4 border-gray-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-white" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertCircleIcon className="w-5 h-5 text-white" />;
      case 'info':
        return <AlertCircleIcon className="w-5 h-5 text-white" />;
      default:
        return <AlertCircleIcon className="w-5 h-5 text-white" />;
    }
  };

  const getCloseButtonStyles = () => {
    return 'p-1 hover:bg-white/20 rounded-md transition-all duration-200 hover:scale-110';
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`${getToastStyles()} px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[320px] max-w-md backdrop-blur-sm`}>
        <div className="flex-shrink-0 animate-pulse">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{title}</p>
          {message && (
            <p className="text-sm text-white/90 mt-0.5">{message}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${getCloseButtonStyles()}`}
            aria-label="Close toast"
          >
            <XIcon className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
