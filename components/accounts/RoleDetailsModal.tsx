import { Modal } from '@/components/ui/modal';
import { ModalSize } from '@/lib/models/modal';
import { Role } from './RolesTable';

const sizeClasses: Record<ModalSize, string> = {
  small: 'max-w-[350px]',
  default: 'max-w-[450px]',
  wide: 'max-w-[550px]',
  wider: 'max-w-[700px]',
  'extra-wide': 'max-w-[900px]',
};

interface RoleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  size?: ModalSize;
}

export default function RoleDetailsModal({ isOpen, onClose, role, size = "wide" }: RoleDetailsModalProps) {
  if (!role) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`${sizeClasses[size]} m-4`}
    >
      <div className={`no-scrollbar relative w-full ${sizeClasses[size]} overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8`}>
        <div className="px-4">
          <div className="space-y-6">
            {/* Modal Title */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Role Details
              </h2>
            </div>

            {/* Role Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name
                </label>
                <div className="text-gray-900 dark:text-white font-medium">
                  {role.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization
                </label>
                <div className="text-gray-900 dark:text-white">
                  {role.organization.name}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <div className="text-gray-900 dark:text-white">
                {role.description || 'No description provided'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Users Assigned
              </label>
              <div className="text-gray-900 dark:text-white">
                {role.userRoles?.length || 0} users
              </div>
            </div>

            {/* Permissions Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions ({role.rolePermissions.length})
              </label>
              {role.rolePermissions.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  No permissions assigned to this role
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {role.rolePermissions.map((rolePermission) => (
                    <div
                      key={rolePermission.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {rolePermission.permission.name}
                      </div>
                      {rolePermission.permission.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {rolePermission.permission.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Users List (if any) */}
            {role.userRoles && role.userRoles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Assigned Users
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {role.userRoles.map((userRole) => (
                    <div
                      key={userRole.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-gray-900 dark:text-white">
                        {userRole.user.email}
                      </span>
                      {userRole.user.employee && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {userRole.user.employee.first_name} {userRole.user.employee.last_name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
