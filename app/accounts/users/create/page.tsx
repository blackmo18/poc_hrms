"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/providers/auth-provider";
import { useRoleAccess } from "@/app/components/providers/role-access-provider";
import Button from "@/app/components/ui/button/Button";
import Input from "@/app/components/ui/input/Input";
import Select from "@/app/components/form/Select";
import MultiSelect from "@/app/components/form/MultiSelect";

interface Organization {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface UserFormData {
  name: string;
  email: string;
  organization_id: string;
  role_ids: string[];
}

export default function CreateUserPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { roles } = useRoleAccess();

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    organization_id: "",
    role_ids: [],
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  // Fetch organizations and roles
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

        // Fetch roles
        const rolesResponse = await fetch('/api/roles', {
          credentials: 'include',
        });

        if (rolesResponse.ok) {
          const rolesResult = await rolesResponse.json();
          setAvailableRoles(rolesResult.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof UserFormData, value: string | string[]) => {
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
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.organization_id) {
      newErrors.organization_id = "Organization is required";
    }

    if (formData.role_ids.length === 0) {
      newErrors.role_ids = "At least one role is required";
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
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          role_ids: formData.role_ids,
        }),
      });

      if (response.ok) {
        router.push('/accounts/users');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to create user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: 'Failed to create user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = availableRoles.map(role => ({
    value: role.id,
    label: role.name,
    description: role.description,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Create New User
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add a new user account with role assignments
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              error={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              error={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
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

          {/* Roles */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Roles *
            </label>
            <MultiSelect
              label=""
              value={formData.role_ids}
              onChange={(values) => handleInputChange('role_ids', values)}
              options={roleOptions}
              placeholder="Select roles"
            />
            {errors.role_ids && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.role_ids}
              </p>
            )}
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
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
