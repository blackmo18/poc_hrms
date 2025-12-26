import Link from "next/link";
import { memo } from "react";
import { PencilIcon, TrashBinIcon } from "@/app/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/app/components/ui/table";
import Badge, { BadgeColor } from "@/app/components/ui/badge/Badge";
import LoadingSkeleton from "@/app/components/ui/LoadingSkeleton";
import UserCard from "@/app/components/accounts/UserCard";
import { UserWithRelations } from "@/lib/models/user";

interface UsersTableBodyProps {
  users: UserWithRelations[];
  getStatusColor: (status: string) => BadgeColor;
  currentPage?: number;
  limit?: number;
  onDelete: (userId: string) => void;
}

const UsersTableBody = memo(function UsersTableBody({ users, getStatusColor, currentPage = 1, limit = 10, onDelete }: UsersTableBodyProps) {
  return (
    <>
      {users.map((user, index) => {
        const rowNumber = (currentPage - 1) * limit + index + 1;
        return (
          <TableRow key={user.id}>
            <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {rowNumber}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {user.employee?.custom_id || '-'}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {user.email}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {user.organization.name}
            </TableCell>
            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
              {user.userRoles.map(userRole => userRole.role.name).join(', ') || 'No roles'}
            </TableCell>
            <TableCell className="px-4 py-3 text-start">
              <Badge
                size="sm"
                color={getStatusColor(user.status)}
              >
                {user.status}
              </Badge>
            </TableCell>
            <TableCell className="px-4 py-3 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Link
                  href={`/accounts/users/${user.id}/edit`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onDelete(user.id)}
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

interface UsersTableProps {
  users: UserWithRelations[];
  loading?: boolean;
  onDelete: (userId: string) => void;
  getStatusColor: (status: string) => BadgeColor;
  currentPage?: number;
  limit?: number;
  fallback?: React.ReactNode;
}

export default function UsersTable({ users, loading = false, onDelete, getStatusColor, currentPage = 1, limit = 10, fallback }: UsersTableProps) {
  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="w-full overflow-x-auto">
        <Table>
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
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Employee ID
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
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
                Roles
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              fallback || <LoadingSkeleton columns={7} hasActions={true} actionButtons={2} />
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-8 text-center text-gray-500">
                  <div>No users found</div>
                </TableCell>
              </TableRow>
            ) : (
              <UsersTableBody users={users} getStatusColor={getStatusColor} currentPage={currentPage} limit={limit} onDelete={onDelete} />
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
