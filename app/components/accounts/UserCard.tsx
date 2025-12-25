import Link from "next/link";
import { PencilIcon, TrashBinIcon, ChevronDownIcon, ChevronUpIcon, OrganizationIcon, UserIcon } from "@/app/icons";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import Badge, { BadgeColor } from "@/app/components/ui/badge/Badge";

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  organization: {
    id: string;
    name: string;
  };
  userRoles: {
    role: {
      id: string;
      name: string;
    };
  }[];
  created_at: string;
}

interface UserCardProps {
  user: User;
  isExpanded: boolean;
  onToggle: (userId: string) => void;
  getStatusColor: (status: string) => BadgeColor;
  onDelete?: (userId: string) => void;
}

export default function UserCard({ user, isExpanded, onToggle, getStatusColor, onDelete }: UserCardProps) {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => onToggle(user.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Name, Status, Email, Organization - stacked vertically */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {user.name || 'N/A'}
                </h3>
              </div>

              <div>
                <Badge size="sm" color={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.userRoles.map(userRole => userRole.role.name).join(', ') || 'No roles'}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <OrganizationIcon className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.organization.name}
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
                Created At
              </span>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/accounts/users/${user.id}/edit`}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={() => onDelete?.(user.id)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 transition-colors"
              >
                <TrashBinIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
