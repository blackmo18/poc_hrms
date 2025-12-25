"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/providers/auth-provider";
import Button from "@/app/components/ui/button/Button";
import Input from "@/app/components/ui/input/Input";
import Select from "@/app/components/form/Select";
import MultiSelect from "@/app/components/form/MultiSelect";

interface Organization {
  id: string;
  name: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface RoleFormData {
  name: string;
  description: string;
  organization_id: string;
  permission_ids: string[];
}

export default function CreateRolePage() {
  const router = useRouter();
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch organizations and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
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
      }
    };

    fetchData();
  }, []);

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
      const response = await fetch('/api/roles', {
        method: 'POST',
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
        setErrors({ submit: errorData.message || 'Failed to create role' });
      }
    } catch (error) {
      console.error('Error creating role:', error);
      setErrors({ submit: 'Failed to create role. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const permissionOptions = permissions.map(permission => ({
    value: permission.id,
    label: permission.name,
    description: permission.description,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Create New Role
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define a new role with associated permissions
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
              label=""
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
              label=""
              value={formData.permission_ids}
              onChange={(values) => handleInputChange('permission_ids', values)}
              options={permissionOptions}
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

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  );
}
