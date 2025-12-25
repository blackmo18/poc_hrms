import React from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon, OrganizationIcon } from '../../icons';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

interface Role {
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
    };
  }[];
  userRoles: {
    id: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface RoleCardProps {
  role: Role;
  isExpanded: boolean;
  onToggle: (roleId: string) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isExpanded,
  onToggle
}) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => onToggle(role.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            {/* Name, Description, Organization - stacked vertically */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {role.name}
                </h3>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {role.description || 'No description'}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <OrganizationIcon className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {role.organization.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {role.userRoles?.length || 0} users • {role.rolePermissions.length} permissions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center ml-4">
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
                Permissions
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {role.rolePermissions.slice(0, 5).map((rolePermission) => (
                  <span
                    key={rolePermission.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {rolePermission.permission.name}
                  </span>
                ))}
                {role.rolePermissions.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{role.rolePermissions.length - 5} more
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Users with this role
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {role.userRoles?.length || 0} users
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Created
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(role.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href={`/accounts/roles/${role.id}/edit`}
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

export default RoleCard;
