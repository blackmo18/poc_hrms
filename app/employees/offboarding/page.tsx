'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { CheckCircleIcon, AlertCircleIcon, PlusIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function OffboardingContent() {
  const offboardingCases = [
    {
      id: 1,
      employee: 'Robert Garcia',
      department: 'Engineering',
      exitDate: 'Jan 31, 2024',
      reason: 'Resignation',
      status: 'in_progress',
      completedTasks: 8,
      totalTasks: 12,
      tasks: [
        { name: 'Final payroll processed', completed: true },
        { name: 'Benefits terminated', completed: true },
        { name: 'Equipment returned', completed: true },
        { name: 'Access revoked', completed: false },
        { name: 'Knowledge transfer', completed: false },
      ],
    },
    {
      id: 2,
      employee: 'Maria Santos',
      department: 'Sales',
      exitDate: 'Feb 15, 2024',
      reason: 'Retirement',
      status: 'pending',
      completedTasks: 0,
      totalTasks: 12,
      tasks: [
        { name: 'Final payroll processed', completed: false },
        { name: 'Benefits terminated', completed: false },
        { name: 'Equipment returned', completed: false },
        { name: 'Access revoked', completed: false },
        { name: 'Knowledge transfer', completed: false },
      ],
    },
  ];

  const getStatusColor = (status: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Employee Offboarding" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Employee Offboarding</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage employee exit and knowledge transfer</p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            New Offboarding
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold mt-2">1</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold mt-2">1</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed This Month</p>
              <p className="text-2xl font-bold mt-2">3</p>
            </CardContent>
          </Card>
        </div>

        {/* Offboarding Cases */}
        <div className="space-y-6">
          {offboardingCases.map((offboarding) => (
            <Card key={offboarding.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{offboarding.employee}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{offboarding.department}</p>
                  </div>
                  <Badge color={getStatusColor(offboarding.status)} variant="light">
                    {offboarding.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Exit Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Exit Date</p>
                    <p className="font-medium">{offboarding.exitDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Reason</p>
                    <p className="font-medium">{offboarding.reason}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Offboarding Progress</p>
                    <p className="text-sm text-gray-600">
                      {offboarding.completedTasks} of {offboarding.totalTasks} tasks
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(offboarding.completedTasks / offboarding.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Tasks Checklist */}
                <div>
                  <p className="text-sm font-medium mb-3">Offboarding Tasks</p>
                  <div className="space-y-2">
                    {offboarding.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {task.completed ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={task.completed ? 'line-through text-gray-500' : ''}>
                          {task.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Update Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export default function OffboardingPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <OffboardingContent />
    </ProtectedRoute>
  );
}
