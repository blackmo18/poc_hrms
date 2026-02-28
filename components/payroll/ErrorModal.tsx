import React from 'react';
import Button from '@/components/ui/button/Button';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  title = 'Error',
  message,
  details,
}: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/10 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md m-4 rounded-3xl bg-white dark:bg-gray-900 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Error Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
          {title}
        </h3>

        {/* Message */}
        <p className="text-base text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Details (if provided) */}
        {details && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono text-center leading-relaxed">
              {details}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={onClose}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
