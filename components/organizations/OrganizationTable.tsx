'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge, { BadgeColor } from '@/components/ui/badge/Badge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { PencilIcon } from '@/icons';

interface Organization {
  id: number;
  name: string;
  email?: string;
  contact_number?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface OrganizationTableBodyProps {
  organizations: Organization[];
  getStatusColor: (status: string) => BadgeColor;
  currentPage?: number;
  limit?: number;
}

const OrganizationTableBody = memo(function OrganizationTableBody({ organizations, getStatusColor, currentPage = 1, limit = 15 }: OrganizationTableBodyProps) {
  return (
    <>
      {organizations.map((org, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
        <TableRow key={org.id}>
          <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {rowNumber}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {org.name}
            </span>
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {org.email || 'N/A'}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {org.contact_number || 'N/A'}
          </TableCell>
          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
            {org.address || 'N/A'}
          </TableCell>
          <TableCell className="px-4 py-3 text-start">
            <Badge
              size="sm"
              color={getStatusColor(org.status)}
            >
              {org.status}
            </Badge>
          </TableCell>
          <TableCell className="px-4 py-3 text-center">
            <Link
              href={`/organizations/details/${org.id}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </Link>
          </TableCell>
        </TableRow>
        );
      })}
    </>
  );
});

interface OrganizationTableProps {
  organizations: Organization[];
  getStatusColor: (status: string) => BadgeColor;
  loading?: boolean;
  fallback?: React.ReactNode;
  currentPage?: number;
  limit?: number;
}

export default function OrganizationTable({ organizations, getStatusColor, loading = false, fallback, currentPage = 1, limit = 15 }: OrganizationTableProps) {
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
                No.
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Organization Name
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
                Contact Number
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Address
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
              <OrganizationTableBody organizations={organizations} getStatusColor={getStatusColor} />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
