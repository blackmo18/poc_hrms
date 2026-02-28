import React from 'react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName: string;
  employeeId: string;
  department: string;
  isLoading?: boolean;
}

export function ReleaseModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  employeeId,
  department,
  isLoading = false,
}: ReleaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/10 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md m-4 rounded-3xl bg-white dark:bg-gray-900 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Success Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
          Release Payroll
        </h3>

        {/* Employee Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">{employeeId}</span>
            <span className="text-xs text-gray-400">|</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{employeeName}</p>
            <span className="text-xs text-gray-400">|</span>
            <Badge color="success" size="sm">{department}</Badge>
          </div>
        </div>

        {/* Action Message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Are you sure you want to release this payroll? This action will change the payroll status from <span className="font-semibold text-yellow-600">APPROVED</span> to <span className="font-semibold text-green-600">RELEASED</span>.
        </p>

        {/* Info Message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Note:</strong> Once released, this payroll will be available for payment processing and the employee will be able to view their payslip.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Release Payroll'}
          </Button>
        </div>
      </div>
    </div>
  );
}
