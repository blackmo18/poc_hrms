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

export interface Role {
  id: string;
  name: string;
  description: string;
  organization: {
    id: string;
    name: string;
  };
  rolePermissions: {
    id: string;
    permission: {
      id: string;
      name: string;
      description?: string;
    };
  }[];
  userRoles: {
    id: string;
    user: {
      id: string;
      email: string;
      name: string;
      employee?: {
        first_name: string;
        last_name: string;
      };
    };
  }[];
  created_at: string;
}

interface RolesTableBodyProps {
  roles: Role[];
  currentPage?: number;
  limit?: number;
  onDeleteRole: (roleId: string) => void;
  onViewDetails: (role: Role) => void;
}

const RolesTableBody = memo(function RolesTableBody({ roles, currentPage = 1, limit = 15, onDeleteRole, onViewDetails }: RolesTableBodyProps) {
  return (
    <>
      {roles.map((role, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
          <TableRow key={role.id}>
            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {rowNumber}
            </TableCell>
            <TableCell className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
              <div className="font-medium">{role.name}</div>
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {role.description || 'No description'}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {role.organization.name}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              <div className="flex flex-wrap gap-1">
                {role.rolePermissions.slice(0, 3).map((rolePermission) => (
                  <span
                    key={rolePermission.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {rolePermission.permission.name}
                  </span>
                ))}
                {role.rolePermissions.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{role.rolePermissions.length - 3} more
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {role.userRoles?.length || 0} users
            </TableCell>
            <TableCell className="px-4 py-3 text-center">
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => onViewDetails(role)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <Link
                  href={`/accounts/roles/${role.id}/edit`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onDeleteRole(role.id)}
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

interface RolesTableProps {
  roles: Role[];
  loading?: boolean;
  fallback?: React.ReactNode;
  currentPage?: number;
  limit?: number;
  onDeleteRole: (roleId: string) => void;
  onViewDetails: (role: Role) => void;
}

export default function RolesTable({ roles, loading = false, fallback, currentPage = 1, limit = 15, onDeleteRole, onViewDetails }: RolesTableProps) {
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
                Permissions
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Users Count
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
              fallback || <LoadingSkeleton columns={7} hasActions={true} actionButtons={3} />
            ) : (
              <RolesTableBody roles={roles} currentPage={currentPage} limit={limit} onDeleteRole={onDeleteRole} onViewDetails={onViewDetails} />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
