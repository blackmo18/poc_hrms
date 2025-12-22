import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashBinIcon, OrganizationIcon } from '@/app/icons';
import Badge, { BadgeColor } from '../../components/ui/badge/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

interface Department {
  id: string;
  name: string;
  description?: string;
  organization: {
    id: string;
    name: string;
  };
  employees: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}

interface DepartmentCardListProps {
  departments: Department[];
  onDelete: (departmentId: string, departmentName: string) => void;
  expandedCards?: Set<string>;
  onToggle?: (departmentId: string) => void;
  getStatusColor?: (status: string) => BadgeColor;
}

const DepartmentCard: React.FC<{
  department: Department;
  isExpanded: boolean;
  onToggle: (departmentId: string) => void;
  onDelete: (departmentId: string, departmentName: string) => void;
  getStatusColor?: (status: string) => BadgeColor;
}> = ({ department, isExpanded, onToggle, onDelete, getStatusColor }) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => onToggle(department.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <OrganizationIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {department.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {department.organization.name}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusColor && (
                  <Badge size="sm" color={getStatusColor('ACTIVE')}>
                    Active
                  </Badge>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {department.employees.length} employees
                </span>
              </div>
            </div>
          </div>
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {department.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{department.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{department.organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{department.employees.length} employees</p>
            </div>
          </div>
        </CardContent>
      )}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
          <Link
            href={`/departments/${department.id}/edit`}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(department.id, department.name);
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 dark:hover:text-red-300 transition-colors"
          >
            <TrashBinIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  );
};

export default function DepartmentCardList({
  departments,
  onDelete,
  expandedCards = new Set(),
  onToggle,
  getStatusColor
}: DepartmentCardListProps) {
  const [localExpandedCards, setLocalExpandedCards] = useState<Set<string>>(expandedCards);

  const handleToggle = (departmentId: string) => {
    const newExpanded = new Set(localExpandedCards);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setLocalExpandedCards(newExpanded);
    onToggle?.(departmentId);
  };

  return (
    <div className="lg:hidden space-y-4">
      {departments.map((department) => (
        <DepartmentCard
          key={department.id}
          department={department}
          isExpanded={localExpandedCards.has(department.id)}
          onToggle={handleToggle}
          onDelete={onDelete}
          getStatusColor={getStatusColor}
        />
      ))}
    </div>
  );
}
