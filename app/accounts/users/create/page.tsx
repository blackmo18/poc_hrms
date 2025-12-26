"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/providers/auth-provider";
import { useRoleAccess } from "@/app/components/providers/role-access-provider";
import PageBreadcrumb from "@/app/components/common/PageBreadCrumb";
import PageMeta from "@/app/components/common/PageMeta";
import Button from "@/app/components/ui/button/Button";
import DetailsConfirmationModal from "@/app/components/ui/modal/DetailsConfirmationModal";
import ConfirmationModal from "@/app/components/ui/modal/ConfirmationModal";
import ErrorModal from "@/app/components/ui/modal/ErrorModal";
import EmployeeSearchModal from "@/app/components/employees/EmployeeSearchModal";
import CreateUserForm from "@/app/components/users/CreateUserForm";
import PasswordPanel from "@/app/components/users/PasswordPanel";
import { DetailItem, GroupedItem } from "@/lib/models/modal";

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
  generated_password?: string;
}

interface ValidationError {
  [key: string]: string;
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
    generated_password: "",
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [passwordResetLink, setPasswordResetLink] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchOrganizations();
    fetchRoles();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Organizations data:', data);
        console.log('Type of data:', typeof data);
        console.log('Is array?', Array.isArray(data));

        // Handle paginated API response { data: organizations, pagination: {...} }
        if (data && data.data && Array.isArray(data.data)) {
          setOrganizations(data.data);
        } else if (Array.isArray(data)) {
          // Handle direct array response
          setOrganizations(data);
        } else if (data && typeof data === 'object' && data.organizations && Array.isArray(data.organizations)) {
          // Handle case where API returns { organizations: [...] }
          setOrganizations(data.organizations);
        } else {
          console.warn('Unexpected organizations data format:', data);
          setOrganizations([]);
        }
      } else {
        console.error('Failed to fetch organizations:', response.status);
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Roles data:', data);

        // Handle paginated API response { data: roles, pagination: {...} }
        if (data && data.data && Array.isArray(data.data)) {
          setAvailableRoles(data.data);
        } else if (Array.isArray(data)) {
          // Handle direct array response
          setAvailableRoles(data);
        } else if (data && typeof data === 'object' && data.roles && Array.isArray(data.roles)) {
          // Handle case where API returns { roles: [...] }
          setAvailableRoles(data.roles);
        } else {
          console.warn('Unexpected roles data format:', data);
          setAvailableRoles([]);
        }
      } else {
        console.error('Failed to fetch roles:', response.status);
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setAvailableRoles([]);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: ValidationError = {};

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
          organization_id: formData.organization_id,
          role_ids: formData.role_ids,
          generated_password: formData.generated_password,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Generate password reset link
        const resetLink = `${window.location.origin}/auth/reset-password?token=${result.passwordResetToken}`;
        setPasswordResetLink(resetLink);

        setShowSuccessModal(true);
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

  const handleSelectEmployee = (employee: any) => {
    setFormData(prev => ({
      ...prev,
      employee_id: employee.id,
      email: employee.email
    }));
    setSelectedEmployeeName(`${employee.first_name} ${employee.last_name}`);
  };

  const handleGeneratePassword = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!selectedEmployeeName) {
      setErrorMessage('Please select an employee first');
      setShowErrorModal(true);
      return;
    }

    // Parse the employee name to get first and last name
    const nameParts = selectedEmployeeName.trim().split(' ');
    const firstName = nameParts[0]?.toLowerCase() || '';
    const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || '';

    // Get current date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Generate base password in format [lastname.firstname.yyyy.mm.dd]
    const basePassword = `${lastName}.${firstName}.${year}.${month}.${day}`;

    // Generate random alphanumeric string (7 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomAlphanumeric = '';
    for (let i = 0; i < 7; i++) {
      randomAlphanumeric += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Final password format: [password]-[random alphanumeric 7]
    const generatedPassword = `${basePassword}-${randomAlphanumeric}`;

    setFormData(prev => ({
      ...prev,
      generated_password: generatedPassword
    }));
  };

  const roleOptions = Array.isArray(availableRoles) ? availableRoles.map(role => ({
    value: role.id,
    text: `${role.name.split('_').join(' ')}`,
  })) : [];

  const confirmationDetails: GroupedItem[] = [
    {
      name: 'User Details',
      fields: [
        { label: 'Organization', value: Array.isArray(organizations) ? organizations.find(org => org.id === formData.organization_id)?.name || 'Unknown' : 'Unknown' },
        { label: 'Employee', value: selectedEmployeeName || 'Unknown' },
        { label: 'Login Email', value: formData.email },
      ]
    },
    {
      name: 'Access Details',
      fields: [
        { label: 'Roles', value: formData.role_ids.length > 0 && Array.isArray(availableRoles) ? availableRoles.filter(role => formData.role_ids.includes(role.id)).map(role => role.name).join(', ') : 'None' },
        { label: 'Password', value: formData.generated_password ? formData.generated_password : 'Not generated' },
      ]
    },
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
            New User Details
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Add a new user account with role assignments
          </p>
        </div>
        <CreateUserForm
          formData={formData}
          errors={errors}
          organizations={organizations}
          roleOptions={roleOptions}
          selectedEmployeeName={selectedEmployeeName}
          onChange={handleInputChange}
          onEmployeeSelect={() => setShowEmployeeModal(true)}
          onGeneratePassword={handleGeneratePassword}
          loading={loading}
        />
        <div className='space-y-6 mb-7' />
        <PasswordPanel
          password={formData.generated_password || ''}
          onPasswordChange={(value) => handleInputChange('generated_password', value)}
          onGeneratePassword={handleGeneratePassword}
          resetLink={passwordResetLink}
          disabled={!selectedEmployeeName}
          loading={loading}
          error={errors.generated_password}
        />
        <div className='flex justify-end pt-4 gap-3'>
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
            disabled={loading}
            className='bg-blue-600 hover:bg-blue-700 text-white'
            onClick={handleCreateClick}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>
      {/* Employee Search Modal */}
      <EmployeeSearchModal
        height='sm'
        width='xx-wide'
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSelectEmployee={handleSelectEmployee}
        organizationId={formData.organization_id}
      />

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        size='wider'
        displayStyle='plain'
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCreate}
        title="Confirm User Creation"
        description="Please review the user details before creating."
        groupedDetails={confirmationDetails}
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

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/accounts/users');
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push('/accounts/users');
        }}
        displayStyle='plain'
        title="User Created Successfully"
        message="User account has been created successfully. The password reset link is available in the Password Management panel below."
        variant="success"
        size="wider"
        confirmText="Close"
        isLoading={false}
      />
    </>
  );
}
