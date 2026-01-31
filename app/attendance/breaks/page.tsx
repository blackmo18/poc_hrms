'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

export default function BreakValidationPage() {
  const breakRecords = [
    {
      id: 1,
      employee: 'John Doe',
      date: 'Jan 22, 2024',
      breakStart: '12:00 PM',
      breakEnd: '01:00 PM',
      duration: '1 hour',
      breakType: 'Lunch',
      isPaid: false,
      status: 'valid',
      withinShift: true,
    },
    {
      id: 2,
      employee: 'Jane Smith',
      date: 'Jan 22, 2024',
      breakStart: '03:30 PM',
      breakEnd: '03:45 PM',
      duration: '15 mins',
      breakType: 'Rest',
      isPaid: true,
      status: 'valid',
      withinShift: true,
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      date: 'Jan 21, 2024',
      breakStart: '06:00 PM',
      breakEnd: '07:00 PM',
      duration: '1 hour',
      breakType: 'Dinner',
      isPaid: false,
      status: 'warning',
      withinShift: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Break Validation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and validate employee break times</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Breaks Today</p>
            <p className="text-2xl font-bold mt-2">{breakRecords.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Valid Breaks</p>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {breakRecords.filter(b => b.status === 'valid').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Issues Found</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">
              {breakRecords.filter(b => b.status === 'warning').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid Breaks</p>
            <p className="text-2xl font-bold mt-2">
              {breakRecords.filter(b => b.isPaid).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Break Records */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Break Records</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {breakRecords.map((record) => (
              <div
                key={record.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{record.employee}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{record.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.status === 'valid' ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                    )}
                    <Badge
                      color={record.status === 'valid' ? 'success' : 'warning'}
                      variant="light"
                    >
                      {record.status === 'valid' ? 'Valid' : 'Warning'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Break Type</p>
                    <p className="font-medium">{record.breakType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Start Time</p>
                    <p className="font-medium">{record.breakStart}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">End Time</p>
                    <p className="font-medium">{record.breakEnd}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="font-medium">{record.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Paid</p>
                    <p className="font-medium">{record.isPaid ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {!record.withinShift && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    ⚠ Break extends beyond shift hours
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Review</Button>
                  <Button size="sm" variant="outline">Adjust</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
