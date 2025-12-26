import React from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, UserIcon, OrganizationIcon } from '../../icons';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Employee } from './EmployeeTable';

interface EmployeeCardProps {
  employee: Employee;
  isExpanded: boolean;
  onToggle: (empId: string) => void;
  getStatusColor: (status: string) => BadgeColor;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  isExpanded,
  onToggle,
  getStatusColor
}) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer relative"
        onClick={() => onToggle(employee.id)}
      >
        <div className="grid grid-cols-[1fr,auto] gap-4 items-start pr-6">
          <div className="flex items-start space-x-4 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Name, Status, Email, Department - stacked vertically */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {employee.first_name} {employee.last_name}
                </h3>
              </div>

              <div>
                <Badge size="sm" color={getStatusColor(employee.employment_status)}>
                  {employee.employment_status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {employee.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {employee.jobTitle.name} • {employee.department.name}
                </p>
              </div>

              <div className="flex items-center space-x-1 min-w-0">
                <OrganizationIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {employee.organization.name}
                </p>
              </div>
            </div>
          </div>

          {/* Arrow Icon - absolutely positioned */}
          <div className="absolute top-3 right-3 flex items-center">
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            {employee.manager && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Manager
                </span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {employee.manager.first_name} {employee.manager.last_name}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Hire Date
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(employee.hire_date).toLocaleDateString()}
              </p>
            </div>

            {employee.user && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  User Account
                </span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {employee.user.email}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Link
                href={`/employees/${employee.id}/edit`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EmployeeCard;
