"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PencilIcon, ArrowLeftIcon } from "@/icons";
import Button from "@/components/ui/button/Button";

interface Role {
  id: string;
  name: string;
  description: string;
  organization: {
    id: string;
    name: string;
  };
  permissions: {
    id: string;
    name: string;
    description: string;
  }[];
  userRoles: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  created_at: string;
  updated_at: string;
}

export default function RoleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleId = params.id as string;

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/roles/${roleId}`, {
          credentials: 'include',
        });

        if (response.status === 403) {
          setError('Access denied. Insufficient permissions.');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch role');
        }

        const result = await response.json();
        setRole(result.data);
      } catch (error) {
        console.error('Error fetching role:', error);
        setError('Failed to load role details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading role details...</div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || 'Role not found'}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h3 className="text-xl font-semibold text-black dark:text-white">
              Role Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View detailed information about this role
            </p>
          </div>
        </div>

        <Link href={`/accounts/roles/${role.id}/edit`}>
          <Button>
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Role
          </Button>
        </Link>
      </div>

      {/* Role Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] p-6">
            <h4 className="text-lg font-medium text-black dark:text-white mb-4">
              Basic Information
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Role Name
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {role.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {role.description || 'No description provided'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Organization
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {role.organization.name}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] p-6">
            <h4 className="text-lg font-medium text-black dark:text-white mb-4">
              Permissions ({role.permissions.length})
            </h4>
            {role.permissions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No permissions assigned to this role
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {role.permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {permission.name}
                      </p>
                      {permission.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata & Users */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] p-6">
            <h4 className="text-lg font-medium text-black dark:text-white mb-4">
              Metadata
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(role.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(role.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Users */}
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] p-6">
            <h4 className="text-lg font-medium text-black dark:text-white mb-4">
              Assigned Users ({role.userRoles.length})
            </h4>
            {role.userRoles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No users assigned to this role
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {role.userRoles.map((userRole) => (
                  <div
                    key={userRole.user.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userRole.user.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {userRole.user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
