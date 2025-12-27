"use client";

import Badge, { BadgeColor } from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card, CardContent } from '@/components/ui/card';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  custom_id: string;
  job_title: string;
  employment_status?: string;
}

interface EmployeeSearchCardProps {
  employee: Employee;
  index: number;
  getStatusColor: (status: string) => BadgeColor;
  onSelectEmployee: (employee: Employee) => void;
}

export default function EmployeeSearchCard({
  employee,
  index,
  getStatusColor,
  onSelectEmployee,
}: EmployeeSearchCardProps) {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Entry Number */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {index + 1}
                </span>
              </div>
            </div>

            {/* Employee Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {employee.last_name}, {employee.first_name}
                </h3>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {employee.custom_id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {employee.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {employee.job_title}
                </p>
              </div>

              {employee.employment_status && (
                <div>
                  <Badge size="sm" color={getStatusColor(employee.employment_status)}>
                    {employee.employment_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Select Button */}
          <div className="flex items-center ml-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSelectEmployee(employee)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Select
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
