'use client';

import { useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import { CheckIcon, XIcon, CalendarIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import Button from '@/components/ui/button/Button';
import { formatUTCDateToReadable } from '@/lib/utils/date-utils';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  remarks?: string;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    customId?: string;
    department: {
      name: string;
    };
    jobTitle: {
      name: string;
    };
  };
  createdAt: string;
}

interface LeaveStats {
  pending: number;
  approvedThisMonth: number;
  totalDaysUsed: number;
  employeesOnLeave: number;
}

function LeaveApprovalsContent() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeaveStats>({
    pending: 0,
    approvedThisMonth: 0,
    totalDaysUsed: 0,
    employeesOnLeave: 0,
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/leave-requests');
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: LeaveRequest[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const pending = requests.filter(req => req.status === 'PENDING').length;
    const approvedThisMonth = requests.filter(req => {
      if (req.status !== 'APPROVED') return false;
      const updatedDate = new Date(req.createdAt);
      return updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
    }).length;
    
    const totalDaysUsed = requests
      .filter(req => req.status === 'APPROVED')
      .reduce((total, req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
      }, 0);

    const employeesOnLeave = requests.filter(req => {
      if (req.status !== 'APPROVED') return false;
      const now = new Date();
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      return now >= start && now <= end;
    }).length;

    setStats({
      pending,
      approvedThisMonth,
      totalDaysUsed,
      employeesOnLeave,
    });
  };

  const getLeaveColor = (type: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (type) {
      case 'VACATION':
        return 'primary';
      case 'SICK':
        return 'warning';
      case 'MATERNITY':
        return 'success';
      case 'EMERGENCY':
        return 'error';
      case 'BEREAVEMENT':
        return 'info';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'CANCELLED':
        return 'info';
      default:
        return 'info';
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // TODO: Get current user ID from authentication context
      const currentUserId = 'mock-user-id';
      
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', approvedById: currentUserId }),
      });
      
      if (response.ok) {
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to approve leave request:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // TODO: Get current user ID from authentication context
      const currentUserId = 'mock-user-id';
      
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', approvedById: currentUserId }),
      });
      
      if (response.ok) {
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to reject leave request:', error);
    }
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <>
        <PageBreadcrumb pageTitle="Leave Approvals" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading leave requests...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Leave Approvals" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold mt-2">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved This Month</p>
              <p className="text-2xl font-bold mt-2">{stats.approvedThisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Days Used</p>
              <p className="text-2xl font-bold mt-2">{stats.totalDaysUsed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees on Leave</p>
              <p className="text-2xl font-bold mt-2">{stats.employeesOnLeave}</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Leave Requests</h2>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests</h3>
                <p className="text-gray-600">No leave requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">
                          {request.employee.firstName} {request.employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.employee.jobTitle.name} • {request.employee.department.name}
                        </p>
                        {request.employee.customId && (
                          <p className="text-xs text-gray-500">ID: {request.employee.customId}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          color={getLeaveColor(request.leaveType)}
                          variant="light"
                        >
                          {request.leaveType}
                        </Badge>
                        <Badge
                          color={getStatusColor(request.status)}
                          variant="light"
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {formatUTCDateToReadable(request.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">End Date</p>
                        <p className="font-medium">{formatUTCDateToReadable(request.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Days</p>
                        <p className="font-medium">{calculateDays(request.startDate, request.endDate)} days</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Reason</p>
                        <p className="font-medium">{request.remarks || 'No reason provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Submitted</p>
                        <p className="font-medium">{formatUTCDateToReadable(request.createdAt)}</p>
                      </div>
                    </div>

                    {request.approvedBy && (
                      <div className="mb-3 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">Approved By</p>
                        <p className="font-medium">
                          {request.approvedBy.firstName} {request.approvedBy.lastName}
                        </p>
                      </div>
                    )}

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center gap-2"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          className="flex items-center gap-2"
                        >
                          <XIcon className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function LeaveApprovalsPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <LeaveApprovalsContent />
    </ProtectedRoute>
  );
}
