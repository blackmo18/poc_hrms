import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  employeeName: string;
  employeeId: string;
  department: string;
  isLoading?: boolean;
}

export function VoidModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  employeeId,
  department,
  isLoading = false,
}: VoidModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/10 backdrop-blur-[2px]"
        onClick={handleClose}
      ></div>
      <div className="relative w-full max-w-md m-4 rounded-3xl bg-white dark:bg-gray-900 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Warning Icon */}
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
          Void Payroll
        </h3>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
          Are you sure you want to void the payroll for <span className="font-semibold">{employeeName}</span>?
        </p>

        {/* Employee Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">{employeeId}</span>
            <span className="text-xs text-gray-400">|</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{employeeName}</p>
            <span className="text-xs text-gray-400">|</span>
            <Badge color="error" size="sm">{department}</Badge>
          </div>
        </div>

        {/* Reason Input */}
        <div className="mb-6">
          <label htmlFor="void-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for voiding <span className="text-red-500">*</span>
          </label>
          <textarea
            id="void-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please enter a reason for voiding this payroll..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            rows={3}
            disabled={isLoading}
          />
          {reason.length === 0 && (
            <p className="mt-1 text-sm text-red-500">Reason is required</p>
          )}
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action cannot be undone. The payroll will be marked as voided and will no longer be available for processing or payment.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Processing...' : 'Void Payroll'}
          </Button>
        </div>
      </div>
    </div>
  );
}
