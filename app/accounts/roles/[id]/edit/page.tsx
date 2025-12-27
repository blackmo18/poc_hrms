"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import MultiSelect from "@/components/form/MultiSelect";

interface Organization {
  id: string;
  name: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  organization_id: string;
  permissions: {
    id: string;
    name: string;
    description: string;
  }[];
}

interface RoleFormData {
  name: string;
  description: string;
  organization_id: string;
  permission_ids: string[];
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    organization_id: "",
    permission_ids: [],
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleId = params.id as string;

  // Fetch role data, organizations and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch role data
        const roleResponse = await fetch(`/api/roles/${roleId}`, {
          credentials: 'include',
        });

        if (roleResponse.ok) {
          const roleResult = await roleResponse.json();
          const roleData = roleResult.data;

          setFormData({
            name: roleData.name,
            description: roleData.description || "",
            organization_id: roleData.organization_id,
            permission_ids: roleData.permissions.map((perm: any) => perm.id),
          });
        }

        // Fetch organizations
        const orgResponse = await fetch('/api/organizations', {
          credentials: 'include',
        });

        if (orgResponse.ok) {
          const orgResult = await orgResponse.json();
          setOrganizations(orgResult.data || []);
        }

        // Fetch permissions
        const permResponse = await fetch('/api/permissions', {
          credentials: 'include',
        });

        if (permResponse.ok) {
          const permResult = await permResponse.json();
          setPermissions(permResult.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchLoading(false);
      }
    };

    if (roleId) {
      fetchData();
    }
  }, [roleId]);

  const handleInputChange = (field: keyof RoleFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    }

    if (!formData.organization_id) {
      newErrors.organization_id = "Organization is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          permission_ids: formData.permission_ids,
        }),
      });

      if (response.ok) {
        router.push('/accounts/roles');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to update role' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setErrors({ submit: 'Failed to update role. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const permissionOptions = permissions.map(permission => ({
    value: permission.id,
    label: permission.name,
    description: permission.description,
  }));

  const handleUpdateClick = () => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading role data...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Edit Role
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update role information and permissions
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter role name"
              error={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization *
            </label>
            <Select
              value={formData.organization_id}
              onChange={(value) => handleInputChange('organization_id', value)}
              options={organizations.map(org => ({
                value: org.id,
                label: org.name
              }))}
              placeholder="Select organization"
            />
            {errors.organization_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.organization_id}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter role description (optional)"
            />
          </div>

          {/* Permissions */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissions
            </label>
            <MultiSelect
              label="Permissions"
              value={formData.permission_ids}
              onChange={(values) => handleInputChange('permission_ids', values)}
              options={permissionOptions.map(permission => ({ value: permission.value, text: `${permission.label}${permission.description ? ` - ${permission.description}` : ''}` }))}
              placeholder="Select permissions for this role"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the permissions that users with this role should have access to.
            </p>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.submit}
            </p>
          </div>
        )}

      </form>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link href="/accounts/roles">
          <Button
            variant="outline"
            size="md"
            disabled={loading}
          >
            Cancel
          </Button>
        </Link>
        <Button
          variant="primary"
          size="md"
          onClick={handleUpdateClick}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Updating...' : 'Update Role'}
        </Button>
      </div>
    </div>
  );
}
