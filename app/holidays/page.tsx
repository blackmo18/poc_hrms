'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { CalendarIcon, PlusIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function HolidaysContent() {
  const holidays = [
    {
      id: 1,
      name: 'New Year\'s Day',
      date: 'Jan 1, 2024',
      type: 'REGULAR',
      multiplier: 2.0,
      isPaidIfNotWorked: true,
      countsTowardOT: false,
    },
    {
      id: 2,
      name: 'EDSA Revolution Anniversary',
      date: 'Feb 25, 2024',
      type: 'REGULAR',
      multiplier: 2.0,
      isPaidIfNotWorked: true,
      countsTowardOT: false,
    },
    {
      id: 3,
      name: 'Araw ng Kagitingan',
      date: 'Apr 9, 2024',
      type: 'SPECIAL_NON_WORKING',
      multiplier: 1.3,
      isPaidIfNotWorked: false,
      countsTowardOT: true,
    },
    {
      id: 4,
      name: 'Labor Day',
      date: 'May 1, 2024',
      type: 'REGULAR',
      multiplier: 2.0,
      isPaidIfNotWorked: true,
      countsTowardOT: false,
    },
  ];

  const getHolidayColor = (type: string) => {
    return type === 'REGULAR' ? 'primary' : 'warning';
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Holidays" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Holiday Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage PH national and company holidays</p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Holiday
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Holidays</p>
              <p className="text-2xl font-bold mt-2">{holidays.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Regular Holidays</p>
              <p className="text-2xl font-bold mt-2">{holidays.filter(h => h.type === 'REGULAR').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Special Non-Working</p>
              <p className="text-2xl font-bold mt-2">{holidays.filter(h => h.type === 'SPECIAL_NON_WORKING').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Holidays Table */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Holiday List</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Holiday Name</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-center py-3 px-4">Type</th>
                    <th className="text-center py-3 px-4">Multiplier</th>
                    <th className="text-center py-3 px-4">Paid if Not Worked</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">{holiday.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          {holiday.date}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          color={getHolidayColor(holiday.type)}
                          variant="light"
                        >
                          {holiday.type === 'REGULAR' ? 'Regular' : 'Special'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{holiday.multiplier}x</td>
                      <td className="py-3 px-4 text-center">
                        {holiday.isPaidIfNotWorked ? '✓' : '✗'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function HolidaysPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <HolidaysContent />
    </ProtectedRoute>
  );
}
