import React from 'react';
import Button from '@/components/ui/button/Button';

interface PayrollActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'approve' | 'void' | 'release';
  isLoading?: boolean;
}

export function PayrollActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type,
  isLoading = false,
}: PayrollActionModalProps) {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'approve':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'void':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'release':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/10 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md m-4 rounded-3xl bg-white dark:bg-gray-900 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            className={getConfirmButtonClass()}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
