import React from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, LockIcon, OrganizationIcon } from '../../icons';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

interface Permission {
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

interface PermissionCardProps {
  permission: Permission;
  isExpanded: boolean;
  onToggle: (permissionId: string) => void;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  isExpanded,
  onToggle
}) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer relative"
        onClick={() => onToggle(permission.id)}
      >
        <div className="grid grid-cols-[1fr,auto] gap-4 items-start pr-6">
          <div className="flex items-start space-x-4 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <LockIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Name, Description, Organization - stacked vertically */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {permission.name}
                </h3>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {permission.description || 'No description'}
                </p>
              </div>

              <div className="flex items-center space-x-1 min-w-0">
                <OrganizationIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {permission.organization?.name || 'Global'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {permission.rolePermissions.length} roles assigned
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
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Assigned to Roles
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {permission.rolePermissions.slice(0, 5).map((rolePermission) => (
                  <span
                    key={rolePermission.role.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {rolePermission.role.name}
                  </span>
                ))}
                {permission.rolePermissions.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{permission.rolePermissions.length - 5} more
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Roles Count
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {permission.rolePermissions.length} roles
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Created
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(permission.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href={`/accounts/permissions/${permission.id}/edit`}
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

export default PermissionCard;
