"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface User {
  id: string;
  name: string;
  email: string;
  organization_id: string;
  status: string;
  roles: {
    id: string;
    name: string;
    description: string;
  }[];
}

interface UserFormData {
  name: string;
  email: string;
  organization_id: string;
  role_ids: string[];
  status: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { roles } = useRoleAccess();

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    organization_id: "",
    role_ids: [],
    status: "ACTIVE",
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userId = params.id as string;
  const isSuperAdmin = roles.includes('SUPER_ADMIN');

  // Fetch user data, organizations and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/users/${userId}`, {
          credentials: 'include',
        });

        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const userData = userResult.data;

          setFormData({
            name: userData.name || "",
            email: userData.email,
            organization_id: userData.organization_id,
            role_ids: userData.roles.map((role: any) => role.id),
            status: userData.status,
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
      } finally {
        setFetchLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

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
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
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
        setErrors({ submit: errorData.message || 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ submit: 'Failed to update user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = availableRoles.map(role => ({
    value: role.id,
    label: role.name,
    description: role.description,
  }));

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading user data...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Edit User
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update user account information and role assignments
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

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <Select
              label=""
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "SUSPENDED", label: "Suspended" },
              ]}
              placeholder="Select status"
            />
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
            {loading ? 'Updating...' : 'Update User'}
          </Button>
        </div>
      </form>
    </div>
  );
}
