'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { MoonIcon, AlertCircleIcon } from 'lucide-react';

export default function NightShiftMonitorPage() {
  const nightShiftWorkers = [
    {
      id: 1,
      employee: 'Robert Garcia',
      department: 'Engineering',
      date: 'Jan 22, 2024',
      shiftStart: '10:00 PM',
      shiftEnd: '06:00 AM',
      nightHours: 8,
      nightDifferential: 0.8,
      status: 'active',
      clockedIn: true,
    },
    {
      id: 2,
      employee: 'Maria Santos',
      department: 'Operations',
      date: 'Jan 22, 2024',
      shiftStart: '11:00 PM',
      shiftEnd: '07:00 AM',
      nightHours: 8,
      nightDifferential: 0.8,
      status: 'active',
      clockedIn: true,
    },
    {
      id: 3,
      employee: 'Carlos Reyes',
      department: 'Engineering',
      date: 'Jan 22, 2024',
      shiftStart: '10:00 PM',
      shiftEnd: '06:00 AM',
      nightHours: 7.5,
      nightDifferential: 0.75,
      status: 'warning',
      clockedIn: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Night Shift Monitoring</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor night shift workers and differential calculations</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Night Shift Workers</p>
            <p className="text-2xl font-bold mt-2">{nightShiftWorkers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Currently Clocked In</p>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {nightShiftWorkers.filter(w => w.clockedIn).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Night Diff Hours</p>
            <p className="text-2xl font-bold mt-2">
              {nightShiftWorkers.reduce((sum, w) => sum + w.nightDifferential, 0).toFixed(1)} hrs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Issues Found</p>
            <p className="text-2xl font-bold mt-2 text-yellow-600">
              {nightShiftWorkers.filter(w => w.status === 'warning').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Night Shift Workers */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Night Shift Workers (10 PM - 6 AM)</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nightShiftWorkers.map((worker) => (
              <div
                key={worker.id}
                className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <MoonIcon className="w-4 h-4 text-blue-600" />
                      {worker.employee}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{worker.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {worker.status === 'warning' && (
                      <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                    )}
                    <Badge
                      color={worker.clockedIn ? 'success' : 'warning'}
                      variant="light"
                    >
                      {worker.clockedIn ? 'Clocked In' : 'Not Clocked In'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-medium">{worker.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Shift Start</p>
                    <p className="font-medium">{worker.shiftStart}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Shift End</p>
                    <p className="font-medium">{worker.shiftEnd}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Night Hours</p>
                    <p className="font-medium">{worker.nightHours} hrs</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Night Diff (+10%)</p>
                    <p className="font-bold text-blue-600">₱ {(worker.nightDifferential * 100).toFixed(0)}</p>
                  </div>
                </div>

                {worker.status === 'warning' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    ⚠ Employee not clocked in for night shift
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm" variant="outline">Adjust Hours</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Night Differential Info */}
      <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Night Differential Calculation</h3>
          <ul className="text-sm space-y-1">
            <li>✓ Night shift: 10:00 PM - 6:00 AM</li>
            <li>✓ Differential rate: +10% of hourly rate</li>
            <li>✓ Applied to all hours worked during night shift</li>
            <li>✓ Automatically calculated from time entries</li>
            <li>✓ Included in payroll processing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
