"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PencilIcon, PlusIcon, TrashBinIcon, EyeIcon } from "@/app/icons";
import Button from "@/app/components/ui/button/Button";

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
  }[];
  created_at: string;
  _count: {
    userRoles: number;
  };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/roles', {
        credentials: 'include',
      });

      if (response.status === 403) {
        setError('Access denied. Insufficient permissions.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }

      const result = await response.json();
      setRoles(result.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setRoles(roles.filter(role => role.id !== roleId));
      } else {
        alert('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Roles
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage user roles and their permissions
          </p>
        </div>

        <Link href="/accounts/roles/create">
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </Link>
      </div>

      {/* Roles Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-100 dark:border-white/[0.05]">
              <tr>
                <th className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Name
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Organization
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Permissions
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Users Count
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading roles...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-5 py-4 text-gray-800 text-start text-theme-sm dark:text-white/90">
                      <div className="font-medium">{role.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {role.description || 'No description'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {role.organization.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {permission.name}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {role._count.userRoles} users
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/accounts/roles/${role.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/accounts/roles/${role.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800 transition-colors"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
