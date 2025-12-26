"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
import EditUserForm from "@/app/components/users/EditUserForm";
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

interface UserData {
  id: string;
  email: string;
  organization_id: string;
  organization: {
    id: string;
    name: string;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    custom_id?: string;
  };
  roles: {
    id: string;
    name: string;
  }[];
  status: string;
  created_at: string;
  updated_at: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [passwordResetLink, setPasswordResetLink] = useState("");

  useEffect(() => {
    fetchRoles();
    fetchUserData();
  }, [userId]);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();

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

  const fetchUserData = async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const userData: UserData = await response.json();
        setUserData(userData);

        // Set organization from user data
        if (userData.organization) {
          setOrganizations([userData.organization]);
        }

        // Populate form data with null checking
        if (!userData.employee) {
          setErrorMessage('User data is incomplete - employee information missing');
          setShowErrorModal(true);
          return;
        }

        setFormData({
          employee_id: userData.employee.id,
          email: userData.email,
          organization_id: userData.organization_id,
          role_ids: userData.roles ? userData.roles.map(role => role.id) : [],
        });

        setSelectedEmployeeName(`${userData.employee.first_name} ${userData.employee.last_name}`);
      } else {
        console.error('Failed to fetch user data:', response.status);
        setErrorMessage('Failed to load user data');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setErrorMessage('Failed to load user data');
      setShowErrorModal(true);
    } finally {
      setFetchLoading(false);
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

  const handleUpdateClick = () => {
    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmModal(false);
    await performUpdate();
  };

  const performUpdate = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: formData.employee_id,
          email: formData.email,
          organization_id: formData.organization_id,
          role_ids: formData.role_ids,
        }),
      });

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to update user');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrorMessage('Failed to update user. Please try again.');
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

    // Generate password: [lastname.firstname.yyyy.mm.dd]-[random alphanumeric 7]
    const [firstName, lastName] = selectedEmployeeName.split(' ');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // Generate random alphanumeric suffix (7 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomSuffix = '';
    for (let i = 0; i < 7; i++) {
      randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const password = `${lastName}.${firstName}.${year}.${month}.${day}-${randomSuffix}`;
    setFormData(prev => ({
      ...prev,
      generated_password: password
    }));
  };

  const handleResetPassword = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!formData.generated_password) {
      setErrorMessage('Please generate a password first');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          new_password: formData.generated_password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPasswordResetLink(data.resetLink);
        setErrorMessage('');
        setFormData(prev => ({
          ...prev,
          generated_password: ''
        }));
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to reset password');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrorMessage('Failed to reset password. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
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
      ]
    },
  ];

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title='Edit User - HR Management System' description='Edit user account details and role assignments' />
      <PageBreadcrumb
        pageTitle='Edit User'
        breadcrumbs={[
          { label: 'Users', href: '/accounts/users' },
          { label: 'Edit' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Edit User Details
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Update user account details and role assignments
          </p>
        </div>
        <EditUserForm
          formData={formData}
          errors={errors}
          organizations={organizations}
          roleOptions={roleOptions}
          selectedEmployeeName={selectedEmployeeName}
          onChange={handleInputChange}
          onEmployeeSelect={() => setShowEmployeeModal(true)}
          loading={loading}
          employeeDetails={userData?.employee ? {
            id: userData.employee.id,
            first_name: userData.employee.first_name,
            last_name: userData.employee.last_name,
            email: userData.email,
            custom_id: userData.employee.custom_id
          } : undefined}
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
            onClick={handleUpdateClick}
          >
            {loading ? 'Updating...' : 'Update User'}
          </Button>
        </div>
      </div>
      <div className='space-y-6 mb-7' />
      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <PasswordPanel
          password={formData.generated_password || ''}
          onPasswordChange={(value) => handleInputChange('generated_password', value)}
          onGeneratePassword={handleGeneratePassword}
          resetLink={passwordResetLink}
          resetLinkLabel="Password Reset Link"
          resetLinkDescription="Generate a new password and share the reset link with the user"
          disabled={!selectedEmployeeName}
          loading={loading}
          error={errors.generated_password}
          showPasswordSection={true}
          showLinkSection={true}
        />
        <div className='flex justify-end pt-4 gap-3'>
          <Button
            variant='primary'
            disabled={loading || !formData.generated_password}
            className='bg-blue-600 hover:bg-blue-700 text-white'
            onClick={handleResetPassword}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </div>

      {/* Employee Search Modal */}

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        size='wider'
        displayStyle='plain'
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm User Update"
        description="Please review the changes before updating the user."
        groupedDetails={confirmationDetails}
        confirmText={loading ? 'Updating...' : 'Update User'}
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
        title="User Updated Successfully"
        message="User account has been updated successfully."
        variant="success"
        size="wider"
        confirmText="Close"
        isLoading={false}
      />
    </>
  );
}
