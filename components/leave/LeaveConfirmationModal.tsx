'use client';

import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import { LeaveRequest } from './LeaveTable';

interface LeaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  formData: {
    leaveType: string;
    startDate: string;
    endDate: string;
    remarks: string;
  };
}

const leaveTypeLabels: { [key: string]: string } = {
  VACATION: 'Vacation Leave',
  SICK: 'Sick Leave',
  EMERGENCY: 'Emergency Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement Leave',
  UNPAID: 'Unpaid Leave',
};

export default function LeaveConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  submitting, 
  formData 
}: LeaveConfirmationModalProps) {
  if (!isOpen) return null;

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const duration = calculateDays(formData.startDate, formData.endDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Confirm Leave Request
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Please review your leave request details before submitting
          </p>
        </div>

        <div className="px-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Leave Details</h6>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {leaveTypeLabels[formData.leaveType] || formData.leaveType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {duration} day{duration !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Date Range</h6>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">From:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(formData.startDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(formData.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {formData.remarks && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Remarks</h6>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg p-3">
                  {formData.remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            Back to Edit
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Confirm Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
