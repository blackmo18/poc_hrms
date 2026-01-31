'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { CheckIcon, XIcon, CalendarIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function LeaveApprovalsContent() {
  const leaveRequests = [
    {
      id: 1,
      employee: 'John Doe',
      department: 'Engineering',
      leaveType: 'VACATION',
      startDate: 'Jan 25, 2024',
      endDate: 'Jan 28, 2024',
      days: 4,
      status: 'pending',
      reason: 'Personal vacation',
      submittedDate: 'Jan 20, 2024',
    },
    {
      id: 2,
      employee: 'Jane Smith',
      department: 'Sales',
      leaveType: 'SICK',
      startDate: 'Jan 23, 2024',
      endDate: 'Jan 23, 2024',
      days: 1,
      status: 'pending',
      reason: 'Medical appointment',
      submittedDate: 'Jan 22, 2024',
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      department: 'Engineering',
      leaveType: 'MATERNITY',
      startDate: 'Feb 1, 2024',
      endDate: 'Apr 30, 2024',
      days: 60,
      status: 'approved',
      reason: 'Maternity leave',
      submittedDate: 'Jan 15, 2024',
    },
  ];

  const getLeaveColor = (type: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (type) {
      case 'VACATION':
        return 'primary';
      case 'SICK':
        return 'warning';
      case 'MATERNITY':
        return 'success';
      default:
        return 'info';
    }
  };

  const handleApprove = (id: number) => {
    console.log('Approved leave request:', id);
  };

  const handleReject = (id: number) => {
    console.log('Rejected leave request:', id);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Leave Approvals" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold mt-2">2</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved This Month</p>
              <p className="text-2xl font-bold mt-2">8</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Days Used</p>
              <p className="text-2xl font-bold mt-2">45</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees on Leave</p>
              <p className="text-2xl font-bold mt-2">3</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Leave Requests</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{request.employee}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        color={getLeaveColor(request.leaveType)}
                        variant="light"
                      >
                        {request.leaveType.replace(/_/g, ' ')}
                      </Badge>
                      <Badge
                        color={request.status === 'pending' ? 'warning' : 'success'}
                        variant="light"
                      >
                        {request.status === 'pending' ? 'Pending' : 'Approved'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                      <p className="font-medium flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {request.startDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">End Date</p>
                      <p className="font-medium">{request.endDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Days</p>
                      <p className="font-medium">{request.days} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Reason</p>
                      <p className="font-medium">{request.reason}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Submitted</p>
                      <p className="font-medium">{request.submittedDate}</p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
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
