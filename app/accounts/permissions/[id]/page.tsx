"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PencilIcon, ArrowLeftIcon } from "@/app/icons";
import Button from "@/app/components/ui/button/Button";

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
      organization: {
        name: string;
      };
    };
  }[];
  created_at: string;
  updated_at: string;
}

export default function PermissionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const permissionId = params.id as string;

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/permissions/${permissionId}`, {
          credentials: 'include',
        });

        if (response.status === 403) {
          setError('Access denied. Insufficient permissions.');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch permission');
        }

        const result = await response.json();
        setPermission(result.data);
      } catch (error) {
        console.error('Error fetching permission:', error);
        setError('Failed to load permission details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (permissionId) {
      fetchPermission();
    }
  }, [permissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading permission details...</div>
      </div>
    );
  }

  if (error || !permission) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error || 'Permission not found'}</p>
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
              Permission Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View detailed information about this permission
            </p>
          </div>
        </div>

        <Link href={`/accounts/permissions/${permission.id}/edit`}>
          <Button>
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Permission
          </Button>
        </Link>
      </div>

      {/* Permission Information */}
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
                  Permission Name
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {permission.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {permission.description || 'No description provided'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Scope
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {permission.organization ? (
                    <span>
                      Organization-specific: {permission.organization.name}
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Global (Available to all organizations)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Roles */}
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] p-6">
            <h4 className="text-lg font-medium text-black dark:text-white mb-4">
              Associated Roles ({permission.rolePermissions.length})
            </h4>
            {permission.rolePermissions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This permission is not assigned to any roles
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permission.rolePermissions.map((rolePermission) => (
                  <div
                    key={rolePermission.role.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {rolePermission.role.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {rolePermission.role.organization.name}
                      </p>
                    </div>
                    <Link
                      href={`/accounts/roles/${rolePermission.role.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      View Role →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-6">
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
                  {new Date(permission.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(permission.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.05] p-6">
            <h4 className="text-lg font-medium text-black dark:text-white mb-4">
              Usage Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Assigned to Roles
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {permission.rolePermissions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
