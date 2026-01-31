'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FilterIcon } from 'lucide-react';

export default function TimesheetViewPage() {
  const timesheetEntries = [
    {
      id: 1,
      date: 'Jan 22, 2024',
      clockIn: '08:00 AM',
      clockOut: '05:00 PM',
      breakTime: '1 hour',
      totalHours: 8,
      status: 'Closed',
    },
    {
      id: 2,
      date: 'Jan 21, 2024',
      clockIn: '08:15 AM',
      clockOut: '05:00 PM',
      breakTime: '1 hour',
      totalHours: 7.75,
      status: 'Closed',
    },
    {
      id: 3,
      date: 'Jan 20, 2024',
      clockIn: '08:00 AM',
      clockOut: '08:00 PM',
      breakTime: '1 hour',
      totalHours: 11,
      status: 'Closed',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Timesheet</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your time entries and attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4" />
            Filter
          </Button>
          <Button className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours This Week</p>
            <p className="text-2xl font-bold mt-2">34.75 hrs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Overtime Hours</p>
            <p className="text-2xl font-bold mt-2">2.75 hrs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">On Time Entries</p>
            <p className="text-2xl font-bold mt-2">2 of 3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</p>
            <p className="text-2xl font-bold mt-2">1</p>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Time Entries</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-center py-3 px-4">Clock In</th>
                  <th className="text-center py-3 px-4">Clock Out</th>
                  <th className="text-center py-3 px-4">Break Time</th>
                  <th className="text-center py-3 px-4">Total Hours</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheetEntries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 font-medium">{entry.date}</td>
                    <td className="py-3 px-4 text-center">{entry.clockIn}</td>
                    <td className="py-3 px-4 text-center">{entry.clockOut}</td>
                    <td className="py-3 px-4 text-center">{entry.breakTime}</td>
                    <td className="py-3 px-4 text-center font-semibold">{entry.totalHours} hrs</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
