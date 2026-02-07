'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { CheckIcon, XIcon, EditIcon } from 'lucide-react';

export default function CorrectionsPage() {
  const corrections = [
    {
      id: 1,
      employee: 'John Doe',
      date: 'Jan 20, 2024',
      originalClockIn: '08:15 AM',
      correctedClockIn: '08:00 AM',
      reason: 'System error - employee was on time',
      status: 'pending',
      requestedBy: 'Employee',
      submittedDate: 'Jan 21, 2024',
    },
    {
      id: 2,
      employee: 'Jane Smith',
      date: 'Jan 19, 2024',
      originalClockOut: '04:45 PM',
      correctedClockOut: '05:00 PM',
      reason: 'Forgot to clock out',
      status: 'approved',
      requestedBy: 'Manager',
      submittedDate: 'Jan 20, 2024',
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      date: 'Jan 18, 2024',
      originalClockIn: 'Missing',
      correctedClockIn: '08:00 AM',
      reason: 'Biometric system malfunction',
      status: 'pending',
      requestedBy: 'HR',
      submittedDate: 'Jan 19, 2024',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Time Entry Corrections</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve time entry corrections</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Corrections</p>
            <p className="text-2xl font-bold mt-2">{corrections.filter(c => c.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Approved This Month</p>
            <p className="text-2xl font-bold mt-2">{corrections.filter(c => c.status === 'approved').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Corrections</p>
            <p className="text-2xl font-bold mt-2">{corrections.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Corrections List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Correction Requests</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {corrections.map((correction) => (
              <div
                key={correction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{correction.employee}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{correction.date}</p>
                  </div>
                  <Badge
                    color={correction.status === 'pending' ? 'warning' : 'success'}
                    variant="light"
                  >
                    {correction.status === 'pending' ? 'Pending' : 'Approved'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Original Time</p>
                    <p className="font-medium">
                      {correction.originalClockIn || correction.originalClockOut}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Corrected Time</p>
                    <p className="font-medium">
                      {correction.correctedClockIn || correction.correctedClockOut}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Reason</p>
                    <p className="font-medium">{correction.reason}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 pb-3 border-b">
                  Requested by {correction.requestedBy} on {correction.submittedDate}
                </div>

                {correction.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
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
  );
}
