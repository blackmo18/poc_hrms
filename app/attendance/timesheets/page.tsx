'use client';

import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterIcon, DownloadIcon } from 'lucide-react';

export default function TimesheetsPage() {
  const router = useRouter();
  
  const employeeTimesheets = [
    {
      id: 1,
      employee: 'John Doe',
      department: 'Engineering',
      weekStart: 'Jan 15, 2024',
      weekEnd: 'Jan 21, 2024',
      totalHours: 40,
      overtimeHours: 2,
      status: 'submitted',
    },
    {
      id: 2,
      employee: 'Jane Smith',
      department: 'Sales',
      weekStart: 'Jan 15, 2024',
      weekEnd: 'Jan 21, 2024',
      totalHours: 38.5,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 3,
      employee: 'Mike Johnson',
      department: 'Engineering',
      weekStart: 'Jan 15, 2024',
      weekEnd: 'Jan 21, 2024',
      totalHours: 42,
      overtimeHours: 4,
      status: 'submitted',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Employee Timesheets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and review employee timesheets by department</p>
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

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Sales</option>
                <option>HR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Week Starting</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                <option>All Status</option>
                <option>Pending</option>
                <option>Submitted</option>
                <option>Approved</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
            <p className="text-2xl font-bold mt-2">{employeeTimesheets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
            <p className="text-2xl font-bold mt-2">{employeeTimesheets.filter(t => t.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total OT Hours</p>
            <p className="text-2xl font-bold mt-2">{employeeTimesheets.reduce((sum, t) => sum + t.overtimeHours, 0).toFixed(2)} hrs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hours/Week</p>
            <p className="text-2xl font-bold mt-2">40.2 hrs</p>
          </CardContent>
        </Card>
      </div>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Timesheet Records</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-center py-3 px-4">Week</th>
                  <th className="text-center py-3 px-4">Total Hours</th>
                  <th className="text-center py-3 px-4">OT Hours</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeeTimesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 font-medium">{timesheet.employee}</td>
                    <td className="py-3 px-4">{timesheet.department}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {timesheet.weekStart} - {timesheet.weekEnd}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{timesheet.totalHours} hrs</td>
                    <td className="py-3 px-4 text-center">{timesheet.overtimeHours.toFixed(2)} hrs</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        timesheet.status === 'submitted' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {timesheet.status === 'submitted' ? 'Submitted' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/employees/${timesheet.id}/attendance`)}
                      >
                        Review
                      </Button>
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
