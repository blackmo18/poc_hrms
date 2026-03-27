import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge, { BadgeColor } from '@/components/ui/badge/Badge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { EyeIcon } from '@/icons';
import { formatUTCDateToReadable } from '@/lib/utils/date-utils';

export interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  remarks?: string;
  createdAt: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId?: string;
    department: {
      name: string;
    };
    jobTitle: {
      name: string;
    };
  };
}

interface LeaveTableBodyProps {
  leaveRequests: LeaveRequest[];
  getStatusColor: (status: string) => BadgeColor;
  currentPage?: number;
  limit?: number;
  onViewDetails: (request: LeaveRequest) => void;
}

const LeaveTableBody = memo(function LeaveTableBody({ 
  leaveRequests, 
  getStatusColor, 
  currentPage = 1, 
  limit = 15,
  onViewDetails
}: LeaveTableBodyProps) {
  return (
    <>
      {leaveRequests.map((request, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
        <TableRow key={request.id}>
          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {rowNumber}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {request.employee.employeeId || '-'}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {request.employee.firstName} {request.employee.lastName}
            </span>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {formatUTCDateToReadable(request.startDate)}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {formatUTCDateToReadable(request.endDate)}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {request.leaveType}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <Badge
              size="sm"
              color={getStatusColor(request.status)}
            >
              {request.status}
            </Badge>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {request.approvedBy ? `${request.approvedBy.firstName} ${request.approvedBy.lastName}` : '-'}
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <button
              onClick={() => onViewDetails(request)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
              title="View Details"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          </TableCell>
        </TableRow>
        );
      })}
    </>
  );
});

// Mobile Card View Component
const LeaveCardView = memo(function LeaveCardView({ 
  leaveRequests, 
  getStatusColor, 
  currentPage = 1, 
  limit = 15,
  onViewDetails
}: LeaveTableBodyProps) {
  return (
    <div className="lg:hidden space-y-4">
      {leaveRequests.map((request, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
          <div 
            key={request.id} 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            {/* Header with employee info and status */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">#{rowNumber}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {request.employee.employeeId || 'No ID'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {request.employee.firstName} {request.employee.lastName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {request.employee.department.name} • {request.employee.jobTitle.name}
                </p>
              </div>
              <Badge
                size="sm"
                color={getStatusColor(request.status)}
              >
                {request.status}
              </Badge>
            </div>

            {/* Leave Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {request.leaveType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Start:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatUTCDateToReadable(request.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">End:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatUTCDateToReadable(request.endDate)}
                </span>
              </div>
              {request.approvedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Approved By:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.approvedBy.firstName} {request.approvedBy.lastName}
                  </span>
                </div>
              )}
            </div>

            {/* Remarks */}
            {request.remarks && (
              <div className="mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Remarks:</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                  "{request.remarks}"
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => onViewDetails(request)}
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
});

interface LeaveTableProps {
  leaveRequests: LeaveRequest[];
  getStatusColor: (status: string) => BadgeColor;
  loading?: boolean;
  currentPage?: number;
  limit?: number;
  fallback?: React.ReactNode;
  onViewDetails: (request: LeaveRequest) => void;
}

export default function LeaveTable({ 
  leaveRequests, 
  getStatusColor, 
  loading = false, 
  fallback, 
  currentPage = 1, 
  limit = 15,
  onViewDetails
}: LeaveTableProps) {
  // Mobile View - Card Layout
  if (leaveRequests.length === 0 && !loading) {
    return (
      <div className="lg:hidden">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            No leave requests found
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="lg:hidden">
        {fallback || (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <LeaveCardView 
        leaveRequests={leaveRequests} 
        getStatusColor={getStatusColor} 
        currentPage={currentPage} 
        limit={limit}
        onViewDetails={onViewDetails}
      />

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  No.
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Employee ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Start Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  End Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Leave Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Approved By
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                fallback || <LoadingSkeleton columns={8} hasActions={true} actionButtons={1} />
              ) : leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div>No leave requests found</div>
                  </TableCell>
                </TableRow>
              ) : (
                <LeaveTableBody 
                  leaveRequests={leaveRequests} 
                  getStatusColor={getStatusColor} 
                  currentPage={currentPage} 
                  limit={limit}
                  onViewDetails={onViewDetails}
                />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
