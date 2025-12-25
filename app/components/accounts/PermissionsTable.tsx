import { memo } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import LoadingSkeleton from '@/app/components/ui/LoadingSkeleton';
import { PencilIcon, EyeIcon, TrashBinIcon } from '@/app/icons';

export interface Permission {
  id: string;
  name: string;
  description: string;
  organization: {
    id: string;
    name: string;
  } | null;
  rolePermissions: {
    role: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface PermissionsTableBodyProps {
  permissions: Permission[];
  currentPage?: number;
  limit?: number;
  onDeletePermission: (permissionId: string) => void;
}

const PermissionsTableBody = memo(function PermissionsTableBody({ permissions, currentPage = 1, limit = 15, onDeletePermission }: PermissionsTableBodyProps) {
  return (
    <>
      {permissions.map((permission, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
          <TableRow key={permission.id}>
            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {rowNumber}
            </TableCell>
            <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
              <div className="font-medium">{permission.name}</div>
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {permission.description || 'No description'}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {permission.organization?.name || 'Global'}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {permission.rolePermissions.length} roles
            </TableCell>
            <TableCell className="px-4 py-3 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Link
                  href={`/accounts/permissions/${permission.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                </Link>
                <Link
                  href={`/accounts/permissions/${permission.id}/edit`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onDeletePermission(permission.id)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 transition-colors"
                >
                  <TrashBinIcon className="w-4 h-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
});

interface PermissionsTableProps {
  permissions: Permission[];
  loading?: boolean;
  fallback?: React.ReactNode;
  currentPage?: number;
  limit?: number;
  onDeletePermission: (permissionId: string) => void;
}

export default function PermissionsTable({ permissions, loading = false, fallback, currentPage = 1, limit = 15, onDeletePermission }: PermissionsTableProps) {
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
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Description
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Organization
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Roles Count
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body - Loading or Data */}
          <TableBody>
            {loading ? (
              fallback || <LoadingSkeleton columns={6} hasActions={true} actionButtons={3} />
            ) : (
              <PermissionsTableBody permissions={permissions} currentPage={currentPage} limit={limit} onDeletePermission={onDeletePermission} />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
