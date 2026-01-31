'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { CheckIcon, XIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function OvertimeApprovalsContent() {
  const otRequests = [
    {
      id: 1,
      employee: 'John Doe',
      department: 'Engineering',
      date: 'Jan 22, 2024',
      requestedHours: 2.5,
      reason: 'Project deadline',
      status: 'pending',
      submittedDate: 'Jan 21, 2024',
    },
    {
      id: 2,
      employee: 'Jane Smith',
      department: 'Sales',
      date: 'Jan 23, 2024',
      requestedHours: 3,
      reason: 'Client meeting preparation',
      status: 'pending',
      submittedDate: 'Jan 22, 2024',
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      department: 'Engineering',
      date: 'Jan 20, 2024',
      requestedHours: 1.5,
      reason: 'System maintenance',
      status: 'approved',
      submittedDate: 'Jan 19, 2024',
    },
  ];

  const handleApprove = (id: number) => {
    console.log('Approved OT request:', id);
  };

  const handleReject = (id: number) => {
    console.log('Rejected OT request:', id);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Overtime Approvals" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold mt-2">2</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total OT Hours</p>
              <p className="text-2xl font-bold mt-2">5.5 hrs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved This Month</p>
              <p className="text-2xl font-bold mt-2">12</p>
            </CardContent>
          </Card>
        </div>

        {/* OT Requests Table */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Overtime Requests</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {otRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{request.employee}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.department}</p>
                    </div>
                    <Badge
                      color={request.status === 'pending' ? 'warning' : 'success'}
                      variant="light"
                    >
                      {request.status === 'pending' ? 'Pending' : 'Approved'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-medium">{request.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Hours Requested</p>
                      <p className="font-medium">{request.requestedHours} hrs</p>
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

export default function OvertimeApprovalsPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <OvertimeApprovalsContent />
    </ProtectedRoute>
  );
}
