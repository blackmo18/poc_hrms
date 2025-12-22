'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import Badge, { BadgeColor } from '@/app/components/ui/badge/Badge';
import { PencilIcon } from '@/app/icons';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employment_status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  organization: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  jobTitle: {
    id: string;
    name: string;
  };
}

interface EmployeeTableBodyProps {
  employees: Employee[];
  getStatusColor: (status: string) => BadgeColor;
  page?: number;
  limit?: number;
}

const EmployeeTableBody = memo(function EmployeeTableBody({ employees, getStatusColor, page = 1, limit = 15 }: EmployeeTableBodyProps) {
  return (
    <>
      {employees.map((employee, index) => (
        <TableRow key={employee.id}>
          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {(page - 1) * limit + index + 1}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {employee.first_name} {employee.last_name}
            </span>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {employee.email}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {employee.department.name}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {employee.jobTitle.name}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {employee.organization.name}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <Badge
              size="sm"
              color={getStatusColor(employee.employment_status)}
            >
              {employee.employment_status}
            </Badge>
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <Link
              href={`/employees/${employee.id}/edit`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </Link>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
});

interface EmployeeTableProps {
  employees: Employee[];
  getStatusColor: (status: string) => BadgeColor;
  loading?: boolean;
  fallback?: React.ReactNode;
  page?: number;
  limit?: number;
}

export default function EmployeeTable({ employees, getStatusColor, loading = false, fallback, page = 1, limit = 15 }: EmployeeTableProps) {
  // Loading skeleton rows
  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`loading-${index}`}>
          <TableCell className="px-5 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="w-full overflow-x-auto">
        <Table>
          {/* Table Header - Static, doesn't re-render */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                #
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Department
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Job Title
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Organization
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body - Loading or Data */}
          <TableBody>
            {loading ? (
              fallback || <LoadingSkeleton />
            ) : (
              <EmployeeTableBody employees={employees} getStatusColor={getStatusColor} page={page} limit={limit} />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
