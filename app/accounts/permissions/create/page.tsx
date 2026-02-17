"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useRoleAccess } from "@/components/providers/role-access-provider";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface Organization {
  id: string;
  name: string;
}

interface PermissionFormData {
  name: string;
  description: string;
  organizationId?: string;
}

export default function CreatePermissionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { roles } = useRoleAccess();

  const [formData, setFormData] = useState<PermissionFormData>({
    name: "",
    description: "",
    organizationId: "",
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  // Fetch organizations
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchOrganizations = async () => {
      try {
        const orgResponse = await fetch('/api/organizations', {
          credentials: 'include',
        });

        if (orgResponse.ok) {
          const result = await orgResponse.json();
          setOrganizations(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchOrganizations();
  }, [isSuperAdmin]);

  const handleInputChange = (field: keyof PermissionFormData, value: string) => {
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
      newErrors.name = "Permission name is required";
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
      const submitData = {
        ...formData,
        // Only include organizationId if it's not empty (for global permissions)
        ...(formData.organizationId && { organizationId: formData.organizationId }),
      };

      // Remove organizationId if it's empty to create global permission
      if (!submitData.organizationId) {
        delete submitData.organizationId;
      }

      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push('/accounts/permissions');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to create permission' });
      }
    } catch (error) {
      console.error('Error creating permission:', error);
      setErrors({ submit: 'Failed to create permission. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Create New Permission
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define a new system permission
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permission Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter permission name (e.g., users.create)"
              error={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Organization (Super Admin only) */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization (Optional)
              </label>
              <Select
                value={formData.organizationId || ""}
                onChange={(value) => handleInputChange('organizationId', value)}
                options={[
                  { value: "", label: "Global (All Organizations)" },
                  ...organizations.map(org => ({
                    value: org.id,
                    label: org.name
                  }))
                ]}
                placeholder="Select organization or leave global"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Leave empty for global permissions available to all organizations
              </p>
            </div>
          )}

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter permission description (optional)"
            />
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
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button disabled={loading}>
            {loading ? 'Creating...' : 'Create Permission'}
          </Button>
        </div>
      </form>
    </div>
  );
}
