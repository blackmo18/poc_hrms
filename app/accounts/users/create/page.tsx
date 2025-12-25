"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/providers/auth-provider";
import { useRoleAccess } from "@/app/components/providers/role-access-provider";
import PageBreadcrumb from "@/app/components/common/PageBreadCrumb";
import PageMeta from "@/app/components/common/PageMeta";
import Button from "@/app/components/ui/button/Button";
import Input from "@/app/components/form/input/InputField";
import Select from "@/app/components/form/Select";
import MultiSelect from "@/app/components/form/MultiSelect";
import Label from "@/app/components/form/Label";
import DetailsConfirmationModal from "@/app/components/ui/modal/DetailsConfirmationModal";
import ErrorModal from "@/app/components/ui/modal/ErrorModal";
import SearchableSelect from "@/app/components/form/SearchableSelect";

interface Organization {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  custom_id?: string;
}

interface UserFormData {
  employee_id: string;
  email: string;
  organization_id: string;
  role_ids: string[];
}

export default function CreateUserPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { roles } = useRoleAccess();

  const [formData, setFormData] = useState<UserFormData>({
    employee_id: "",
    email: "",
    organization_id: "",
    role_ids: [],
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');

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

  // Fetch employees when organization is selected (for email auto-populate)
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!formData.employee_id) {
        setSelectedEmployeeName('');
        return;
      }

      try {
        const response = await fetch(`/api/employees/${formData.employee_id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          setSelectedEmployeeName(`${result.first_name} ${result.last_name}`);
          if (result.custom_id) {
            setFormData(prev => ({
              ...prev,
              email: result.custom_id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching employee details:', error);
        setSelectedEmployeeName('');
      }
    };

    fetchEmployeeDetails();
  }, [formData.employee_id]);

  const handleInputChange = (field: keyof UserFormData, value: string | string[]) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Clear employee selection when organization changes
      if (field === 'organization_id') {
        newData.employee_id = '';
        newData.email = '';
      }

      return newData;
    });

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

    if (!formData.employee_id) {
      newErrors.employee_id = "Employee is required";
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

  const handleCreateClick = () => {
    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirmModal(false);
    await performCreate();
  };

  const performCreate = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: formData.employee_id,
          email: formData.email,
          role_ids: formData.role_ids,
        }),
      });

      if (response.ok) {
        router.push('/accounts/users');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to create user');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage('Failed to create user. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = useCallback(async (query: string) => {
    if (!formData.organization_id) return [];

    const response = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}&organizationId=${formData.organization_id}`, {
      credentials: 'include',
    });

    if (!response.ok) return [];

    const result = await response.json();
    return result.data.map((emp: any) => ({
      value: emp.id.toString(),
      label: `${emp.last_name}, ${emp.first_name} (${emp.custom_id})-${emp.job_title}`,
    }));
  }, [formData.organization_id]);

  const roleOptions = availableRoles.map(role => ({
    value: role.id,
    text: `${role.name}${role.description ? ` - ${role.description}` : ''}`,
  }));

  const confirmationDetails = [
    { label: 'Organization', value: organizations.find(org => org.id === formData.organization_id)?.name || 'Unknown' },
    { label: 'Employee', value: selectedEmployeeName || 'Unknown' },
    { label: 'Login Email', value: formData.email },
    { label: 'Roles', value: formData.role_ids.length > 0 ? availableRoles.filter(role => formData.role_ids.includes(role.id)).map(role => role.name).join(', ') : 'None' },
  ];

  return (
    <>
      <PageMeta title='Create User - HR Management System' description='Create a new user account with role assignments' />
      <PageBreadcrumb
        pageTitle='Create User'
        breadcrumbs={[
          { label: 'Users', href: '/accounts/users' },
          { label: 'Create' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Create New User
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Add a new user account with role assignments
          </p>
        </div>

        <form className='space-y-6 mb-7'>
          <div className='grid grid-cols-1 gap-6'>
            {/* Organization */}
            <div>
              <Label>Organization *</Label>
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

            {/* Employee */}
            <div>
              <Label>Employee *</Label>
              <SearchableSelect
                value={formData.employee_id}
                onChange={(value) => handleInputChange('employee_id', value)}
                placeholder="Search employees"
                disabled={!formData.organization_id}
                onSearch={onSearch}
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.employee_id}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Login Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Employee ID will be used as email"
                error={!!errors.email}
                disabled={!!formData.employee_id} // Disable when employee is selected
              />
              {formData.employee_id && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Email is auto-populated from employee ID
                </p>
              )}
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Roles */}
            <div>
              <Label>Roles *</Label>
              <MultiSelect
                label="Roles"
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
        </form>

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href="/accounts/users">
            <Button
              variant='outline'
              size='md'
              disabled={loading}
            >
              Cancel
            </Button>
          </Link>
          <Button
            variant='primary'
            size='md'
            onClick={handleCreateClick}
            disabled={loading}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        size='wider'
        displayStyle='plain'
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCreate}
        title="Confirm User Creation"
        description="Please review the user details before creating."
        details={confirmationDetails}
        confirmText={loading ? 'Creating...' : 'Create User'}
        cancelText="Cancel"
        isLoading={loading}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
      />
    </>
  );
}
