'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { PlusIcon, UsersIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function CalendarsContent() {
  const calendars = [
    {
      id: 1,
      name: 'Default Calendar',
      description: 'Standard PH national holidays',
      type: 'DEFAULT',
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: 'Dec 31, 2024',
      assignedEmployees: 45,
      holidayCount: 12,
    },
    {
      id: 2,
      name: 'Regional Calendar - Luzon',
      description: 'Luzon region specific holidays',
      type: 'REGIONAL',
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: 'Dec 31, 2024',
      assignedEmployees: 20,
      holidayCount: 14,
    },
    {
      id: 3,
      name: 'Regional Calendar - Visayas',
      description: 'Visayas region specific holidays',
      type: 'REGIONAL',
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: 'Dec 31, 2024',
      assignedEmployees: 15,
      holidayCount: 14,
    },
    {
      id: 4,
      name: 'Company Calendar',
      description: 'Company-specific holidays and events',
      type: 'COMPANY',
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: 'Dec 31, 2024',
      assignedEmployees: 60,
      holidayCount: 5,
    },
  ];

  const getCalendarColor = (type: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (type) {
      case 'DEFAULT':
        return 'primary';
      case 'REGIONAL':
        return 'info';
      case 'COMPANY':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Calendars" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Calendar Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage organization and regional calendars</p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Create Calendar
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Calendars</p>
              <p className="text-2xl font-bold mt-2">{calendars.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Calendars</p>
              <p className="text-2xl font-bold mt-2">{calendars.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold mt-2">140</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Holidays</p>
              <p className="text-2xl font-bold mt-2">45</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {calendars.map((calendar) => (
            <Card key={calendar.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{calendar.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {calendar.description}
                    </p>
                  </div>
                  <Badge color={getCalendarColor(calendar.type)} variant="light">
                    {calendar.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Effective From</p>
                    <p className="font-medium">{calendar.effectiveFrom}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Effective To</p>
                    <p className="font-medium">{calendar.effectiveTo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Holidays</p>
                    <p className="font-medium">{calendar.holidayCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Assigned</p>
                    <p className="font-medium flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      {calendar.assignedEmployees}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                  <Button variant="outline" size="sm" className="flex-1">Assign</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export default function CalendarsPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <CalendarsContent />
    </ProtectedRoute>
  );
}
