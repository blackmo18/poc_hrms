"use client";

import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import Badge, { BadgeColor } from '@/app/components/ui/badge/Badge';
import Button from '@/app/components/ui/button/Button';
import LoadingSkeleton from '@/app/components/ui/LoadingSkeleton';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  custom_id: string;
  job_title: string;
  employment_status?: string;
}

interface EmployeeSearchTableBodyProps {
  employees: Employee[];
  getStatusColor: (status: string) => BadgeColor;
  onSelectEmployee: (employee: Employee) => void;
  currentPage?: number;
  limit?: number;
}

const EmployeeSearchTableBody = memo(function EmployeeSearchTableBody({ 
  employees, 
  getStatusColor, 
  onSelectEmployee, 
  currentPage = 1, 
  limit = 10 
}: EmployeeSearchTableBodyProps) {
  return (
    <>
      {employees.map((employee, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
          <TableRow key={employee.id}>
            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {rowNumber}
            </TableCell>
            <TableCell className="px-4 py-3 text-start">
              <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {employee.last_name}, {employee.first_name}
              </span>
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {employee.custom_id}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {employee.email}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {employee.job_title}
            </TableCell>
            <TableCell className="px-4 py-3 text-start">
              {employee.employment_status && (
                <Badge
                  size="sm"
                  color={getStatusColor(employee.employment_status)}
                >
                  {employee.employment_status}
                </Badge>
              )}
            </TableCell>
            <TableCell className="px-4 py-3 text-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelectEmployee(employee)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Select
              </Button>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
});

interface EmployeeSearchTableProps {
  employees: Employee[];
  getStatusColor: (status: string) => BadgeColor;
  onSelectEmployee: (employee: Employee) => void;
  loading?: boolean;
  fallback?: React.ReactNode;
  currentPage?: number;
  limit?: number;
}

export default function EmployeeSearchTable({
  employees,
  getStatusColor,
  onSelectEmployee,
  loading = false,
  fallback,
  currentPage = 1,
  limit = 10,
}: EmployeeSearchTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="w-full overflow-x-auto">
        <Table>
          {/* Table Header - Static, doesn't re-render */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                No.
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
                Employee ID
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
                Job Title
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
              fallback || <LoadingSkeleton columns={7} hasActions={true} actionButtons={1} />
            ) : (
              <EmployeeSearchTableBody 
                employees={employees} 
                getStatusColor={getStatusColor} 
                onSelectEmployee={onSelectEmployee}
                currentPage={currentPage}
                limit={limit}
              />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
