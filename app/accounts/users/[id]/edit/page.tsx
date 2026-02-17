"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useRoleAccess } from "@/components/providers/role-access-provider";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import DetailsConfirmationModal from "@/components/ui/modal/DetailsConfirmationModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import ErrorModal from "@/components/ui/modal/ErrorModal";
import EmployeeSearchModal from "@/components/employees/EmployeeSearchModal";
import EditUserForm from '@/components/users/EditUserForm';
import PasswordPanel from '@/components/users/PasswordPanel';
import { DetailItem, GroupedItem } from '@/lib/models/modal';
import InitialLoadingScreen from '@/components/common/InitialLoadingScreen';

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
  organizationId: string;
  role_ids: string[];
  generated_password?: string;
}

interface ValidationError {
  [key: string]: string;
}

interface UserData {
  id: string;
  email: string;
  organizationId: string;
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

interface EditUserState {
  // Form data
  formData: UserFormData;
  errors: ValidationError;

  // Loading states
  loading: boolean;
  initialLoading: boolean;
  fetchLoading: boolean;

  // UI states
  showConfirmModal: boolean;
  showErrorModal: boolean;
  showEmployeeModal: boolean;
  showSuccessModal: boolean;
  errorMessage: string;

  // Data states
  organizations: Organization[];
  availableRoles: Role[];
  userData: UserData | null;
  selectedEmployeeName: string;
  passwordResetLink: string;
}

type EditUserAction =
  // Form actions
  | { type: 'SET_FORM_DATA'; payload: Partial<UserFormData> }
  | { type: 'SET_ERRORS'; payload: ValidationError }
  | { type: 'CLEAR_FIELD_ERROR'; payload: keyof UserFormData }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_FETCH_LOADING'; payload: boolean }

  // UI actions
  | { type: 'SET_SHOW_CONFIRM_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_ERROR_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_EMPLOYEE_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_SUCCESS_MODAL'; payload: boolean }
  | { type: 'SET_ERROR_MESSAGE'; payload: string }

  // Combined actions
  | { type: 'FINISH_LOADING' }

  // Data actions
  | { type: 'SET_ORGANIZATIONS'; payload: Organization[] }
  | { type: 'SET_AVAILABLE_ROLES'; payload: Role[] }
  | { type: 'SET_USER_DATA'; payload: UserData | null }
  | { type: 'SET_SELECTED_EMPLOYEE_NAME'; payload: string }
  | { type: 'SET_PASSWORD_RESET_LINK'; payload: string };

function editUserReducer(state: EditUserState, action: EditUserAction): EditUserState {
  switch (action.type) {
    // Form actions
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'CLEAR_FIELD_ERROR':
      return { ...state, errors: { ...state.errors, [action.payload]: '' } };

    // Loading actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INITIAL_LOADING':
      return { ...state, initialLoading: action.payload };
    case 'SET_FETCH_LOADING':
      return { ...state, fetchLoading: action.payload };

    // UI actions
    case 'SET_SHOW_CONFIRM_MODAL':
      return { ...state, showConfirmModal: action.payload };
    case 'SET_SHOW_ERROR_MODAL':
      return { ...state, showErrorModal: action.payload };
    case 'SET_SHOW_EMPLOYEE_MODAL':
      return { ...state, showEmployeeModal: action.payload };
    case 'SET_SHOW_SUCCESS_MODAL':
      return { ...state, showSuccessModal: action.payload };
    case 'SET_ERROR_MESSAGE':
      return { ...state, errorMessage: action.payload };

    // Combined actions
    case 'FINISH_LOADING':
      return { ...state, loading: false, initialLoading: false };

    // Data actions
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload };
    case 'SET_AVAILABLE_ROLES':
      return { ...state, availableRoles: action.payload };
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    case 'SET_SELECTED_EMPLOYEE_NAME':
      return { ...state, selectedEmployeeName: action.payload };
    case 'SET_PASSWORD_RESET_LINK':
      return { ...state, passwordResetLink: action.payload };

    default:
      return state;
  }
}

const initialEditUserState: EditUserState = {
  // Form data
  formData: {
    employee_id: '',
    email: '',
    organizationId: '',
    role_ids: [],
    generated_password: '',
  },
  errors: {},

  // Loading states
  loading: false,
  initialLoading: true,
  fetchLoading: false,

  // UI states
  showConfirmModal: false,
  showErrorModal: false,
  showEmployeeModal: false,
  showSuccessModal: false,
  errorMessage: '',

  // Data states
  organizations: [],
  availableRoles: [],
  userData: null,
  selectedEmployeeName: '',
  passwordResetLink: '',
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user } = useAuth();
  const { roles } = useRoleAccess();
  const [state, dispatch] = useReducer(editUserReducer, initialEditUserState);

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
          dispatch({ type: 'SET_AVAILABLE_ROLES', payload: data.data });
        } else if (Array.isArray(data)) {
          // Handle direct array response
          dispatch({ type: 'SET_AVAILABLE_ROLES', payload: data });
        } else if (data && typeof data === 'object' && data.roles && Array.isArray(data.roles)) {
          // Handle case where API returns { roles: [...] }
          dispatch({ type: 'SET_AVAILABLE_ROLES', payload: data.roles });
        } else {
          console.warn('Unexpected roles data format:', data);
          dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
        }
      } else {
        console.error('Failed to fetch roles:', response.status);
        dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      dispatch({ type: 'SET_AVAILABLE_ROLES', payload: [] });
    }
  };

  const fetchUserData = async () => {
    dispatch({ type: 'SET_FETCH_LOADING', payload: true });
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const userData: UserData = await response.json();
        dispatch({ type: 'SET_USER_DATA', payload: userData });

        // Set organization from user data
        if (userData.organization) {
          dispatch({ type: 'SET_ORGANIZATIONS', payload: [userData.organization] });
        }

        // Populate form data with null checking
        if (!userData.employee) {
          dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'User data is incomplete - employee information missing' });
          dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
          return;
        }

        dispatch({ type: 'SET_FORM_DATA', payload: {
          employee_id: userData.employee.id,
          email: userData.email,
          organizationId: userData.organizationId,
          role_ids: userData.roles ? userData.roles.map(role => role.id) : [],
        }});

        dispatch({ type: 'SET_SELECTED_EMPLOYEE_NAME', payload: `${userData.employee.first_name} ${userData.employee.last_name}` });
      } else {
        console.error('Failed to fetch user data:', response.status);
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Failed to load user data' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Failed to load user data' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    } finally {
      dispatch({ type: 'FINISH_LOADING' });
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    dispatch({ type: 'SET_FORM_DATA', payload: { [field]: value } });

    // Clear error for this field
    if (state.errors[field]) {
      dispatch({ type: 'CLEAR_FIELD_ERROR', payload: field });
    }
  };

  const validateForm = () => {
    const newErrors: ValidationError = {};

    if (!state.formData.employee_id) {
      newErrors.employee_id = "Employee is required";
    }

    if (!state.formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(state.formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!state.formData.organizationId) {
      newErrors.organizationId = "Organization is required";
    }

    if (state.formData.role_ids.length === 0) {
      newErrors.role_ids = "At least one role is required";
    }

    dispatch({ type: 'SET_ERRORS', payload: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateClick = () => {
    if (!validateForm()) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Please fill in all required fields' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      return;
    }
    dispatch({ type: 'SET_SHOW_CONFIRM_MODAL', payload: true });
  };

  const handleConfirmUpdate = async () => {
    dispatch({ type: 'SET_SHOW_CONFIRM_MODAL', payload: false });
    await performUpdate();
  };

  const performUpdate = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: state.formData.employee_id,
          email: state.formData.email,
          organizationId: state.formData.organizationId,
          role_ids: state.formData.role_ids,
        }),
      });

      if (response.ok) {
        dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: true });
      } else {
        const errorData = await response.json();
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: errorData.message || 'Failed to update user' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Failed to update user. Please try again.' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSelectEmployee = (employee: any) => {
    dispatch({ type: 'SET_FORM_DATA', payload: {
      employee_id: employee.id,
      email: employee.email
    }});
    dispatch({ type: 'SET_SELECTED_EMPLOYEE_NAME', payload: `${employee.first_name} ${employee.last_name}` });
  };

  const handleGeneratePassword = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!state.selectedEmployeeName) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Please select an employee first' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      return;
    }

    // Generate password: [lastname.firstname.yyyy.mm.dd]-[random alphanumeric 7]
    const [firstName, lastName] = state.selectedEmployeeName.split(' ');
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
    dispatch({ type: 'SET_FORM_DATA', payload: { generated_password: password } });
  };

  const handleResetPassword = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!state.formData.generated_password) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Please generate a password first' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          new_password: state.formData.generated_password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_PASSWORD_RESET_LINK', payload: data.resetLink });
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: '' });
        dispatch({ type: 'SET_FORM_DATA', payload: { generated_password: '' } });
      } else {
        const errorData = await response.json();
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: errorData.error || 'Failed to reset password' });
        dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Failed to reset password. Please try again.' });
      dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const roleOptions = Array.isArray(state.availableRoles) ? state.availableRoles.map(role => ({
    value: role.id,
    text: `${role.name.split('_').join(' ')}`,
  })) : [];

  const confirmationDetails: GroupedItem[] = [
    {
      name: 'User Details',
      fields: [
        { label: 'Organization', value: Array.isArray(state.organizations) ? state.organizations.find(org => org.id === state.formData.organizationId)?.name || 'Unknown' : 'Unknown' },
        { label: 'Employee', value: state.selectedEmployeeName || 'Unknown' },
        { label: 'Login Email', value: state.formData.email },
      ]
    },
    {
      name: 'Access Details',
      fields: [
        { label: 'Roles', value: state.formData.role_ids.length > 0 && Array.isArray(state.availableRoles) ? state.availableRoles.filter(role => state.formData.role_ids.includes(role.id)).map(role => role.name).join(', ') : 'None' },
      ]
    },
  ];

  if (state.initialLoading) { // display this only on first page load
    return (
      <InitialLoadingScreen
        title="Edit User"
        subtitle="Edit user account details and role assignments"
        loadingText="Loading employees..."
      />
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
          formData={state.formData}
          errors={state.errors}
          organizations={state.organizations}
          roleOptions={roleOptions}
          selectedEmployeeName={state.selectedEmployeeName}
          onChange={handleInputChange}
          onEmployeeSelect={() => dispatch({ type: 'SET_SHOW_EMPLOYEE_MODAL', payload: true })}
          loading={state.loading}
          employeeDetails={state.userData?.employee ? {
            id: state.userData.employee.id,
            first_name: state.userData.employee.first_name,
            last_name: state.userData.employee.last_name,
            email: state.formData.email,
            custom_id: state.userData.employee.custom_id
          } : undefined}
        />
        <div className='flex justify-end pt-4 gap-3'>
          <Link href="/accounts/users">
            <Button
              variant='outline'
              size='md'
              disabled={state.loading}
            >
              Cancel
            </Button>
          </Link>
          <Button
            variant='primary'
            disabled={state.loading}
            className='bg-blue-600 hover:bg-blue-700 text-white'
            onClick={handleUpdateClick}
          >
            {state.loading ? 'Updating...' : 'Update User'}
          </Button>
        </div>
      </div>
      <div className='space-y-6 mb-7' />
      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <PasswordPanel
          password={state.formData.generated_password || ''}
          onPasswordChange={(value) => handleInputChange('generated_password', value)}
          onGeneratePassword={handleGeneratePassword}
          resetLink={state.passwordResetLink}
          resetLinkLabel="Password Reset Link"
          resetLinkDescription="Generate a new password and share the reset link with the user"
          disabled={!state.selectedEmployeeName}
          loading={state.loading}
          error={state.errors.generated_password}
          showPasswordSection={true}
          showLinkSection={true}
        />
        <div className='flex justify-end pt-4 gap-3'>
          <Button
            variant='primary'
            disabled={state.loading || !state.formData.generated_password}
            className='bg-blue-600 hover:bg-blue-700 text-white'
            onClick={handleResetPassword}
          >
            {state.loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </div>

      {/* Employee Search Modal */}
      <EmployeeSearchModal
        height='sm'
        width='xx-wide'
        isOpen={state.showEmployeeModal}
        onClose={() => dispatch({ type: 'SET_SHOW_EMPLOYEE_MODAL', payload: false })}
        onSelectEmployee={handleSelectEmployee}
        organizationId={state.formData.organizationId}
      />

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        size='wider'
        displayStyle='plain'
        isOpen={state.showConfirmModal}
        onClose={() => dispatch({ type: 'SET_SHOW_CONFIRM_MODAL', payload: false })}
        onConfirm={handleConfirmUpdate}
        title="Confirm User Update"
        description="Please review the changes before updating the user."
        groupedDetails={confirmationDetails}
        confirmText={state.loading ? 'Updating...' : 'Update User'}
        cancelText="Cancel"
        isLoading={state.loading}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={state.showErrorModal}
        onClose={() => dispatch({ type: 'SET_SHOW_ERROR_MODAL', payload: false })}
        errorMessage={state.errorMessage}
      />

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={state.showSuccessModal}
        onClose={() => {
          dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: false });
          router.push('/accounts/users');
        }}
        onConfirm={() => {
          dispatch({ type: 'SET_SHOW_SUCCESS_MODAL', payload: false });
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
