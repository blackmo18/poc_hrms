import React from 'react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName: string;
  employeeId: string;
  department: string;
  isLoading?: boolean;
}

export function ApproveModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  employeeId,
  department,
  isLoading = false,
}: ApproveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto modal z-99999">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/10 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-md m-4 rounded-3xl bg-white dark:bg-gray-900 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Success Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
          Approve Payroll
        </h3>

        {/* Employee Details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-gray-600 dark:text-gray-400">{employeeId}</span>
            <span className="text-xs text-gray-400">|</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{employeeName}</p>
            <span className="text-xs text-gray-400">|</span>
            <Badge color="info" size="sm">{department}</Badge>
          </div>
        </div>

        {/* Action Message */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Are you sure you want to approve this payroll? This action will change the payroll status from <span className="font-semibold text-blue-600">COMPUTED</span> to <span className="font-semibold text-yellow-600">APPROVED</span>.
        </p>

        {/* Info Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Once approved, this payroll will be ready for release and payment processing.
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Approve Payroll'}
          </Button>
        </div>
      </div>
    </div>
  );
}
