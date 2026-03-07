'use client';

import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';
import { LeaveRequest } from './LeaveTable';
import { formatUTCDateToReadable } from '@/lib/utils/date-utils';
import Badge, { BadgeColor } from '../ui/badge/Badge';

interface LeaveDetailsModalProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  getStatusColor: (status: string) => BadgeColor;
}

const statusConfig = {
  PENDING: { icon: '🕐', color: 'warning' as BadgeColor },
  APPROVED: { icon: '✅', color: 'success' as BadgeColor },
  REJECTED: { icon: '❌', color: 'error' as BadgeColor },
  CANCELLED: { icon: '⚠️', color: 'dark' as BadgeColor },
};

export default function LeaveDetailsModal({ request, isOpen, onClose, getStatusColor }: LeaveDetailsModalProps) {
  if (!isOpen || !request) return null;

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[600px] m-4"
    >
      <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Leave Request Details
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Review the details of this leave request
          </p>
        </div>

        <div className="px-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Request Information</h6>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Leave Type:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{request.leaveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <Badge
                      size="sm"
                      color={getStatusColor(request.status)}
                      variant="light"
                    >
                      {statusConfig[request.status as keyof typeof statusConfig]?.icon} {request.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {calculateDays(request.startDate, request.endDate)} days
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Date Information</h6>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Start Date:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatUTCDateToReadable(request.startDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">End Date:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatUTCDateToReadable(request.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Submitted:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatUTCDateToReadable(request.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {request.approvedBy && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Approval Information</h6>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Approved By:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.approvedBy.firstName} {request.approvedBy.lastName}
                  </span>
                </div>
              </div>
            )}

            {request.remarks && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Remarks</h6>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-lg p-3">
                  {request.remarks}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 mt-6 justify-end md:hidden">
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
