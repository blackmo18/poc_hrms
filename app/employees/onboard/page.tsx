'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import Button from '@/components/ui/button/Button';
import { validateEmployeeForm } from '@/lib/utils/employeeValidation';
import { getEmployeeGroupedDetails } from '@/lib/utils/employeeDetails';
import DetailsConfirmationModal from '@/components/ui/modal/DetailsConfirmationModal';
import ConfirmationModal from '@/components/ui/modal/ConfirmationModal';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleAccess } from '@/components/providers/role-access-provider';

interface Organization {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  organizationId: number;
}

interface JobTitle {
  id: number;
  name: string;
  organizationId: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  organizationId: number;
}

export default function EmployeeOnboardingPage() {
  const { user, isLoading } = useAuth();
  const { roles } = useRoleAccess();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form state
  const initialFormData = {
    organizationId: '',
    department_id: '',
    job_title_id: '',
    manager_id: '',
    custom_id: '', // Organization-specific custom employee ID
    first_name: '',
    last_name: '',
    // Work details (required work email)
    work_email: '',
    work_contact: '',
    // Personal details (required except personal_email)
    personal_address: '',
    personal_contact_number: '',
    personal_email: '',
    date_of_birth: new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0],
    gender: '',
    employment_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE',
    hire_date: new Date().toISOString().split('T')[0], // Today's date
  };

  const [formData, setFormData] = useState(initialFormData);

  // Data for dropdowns
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);

  // Grouped details for confirmation
  const grouped = getEmployeeGroupedDetails(formData, organizations, departments, jobTitles, managers);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user) {
      fetchOrganizations();
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (formData.organizationId) {
      fetchDepartments(formData.organizationId);
      fetchJobTitles(formData.organizationId);
      fetchManagers(formData.organizationId);
    }
  }, [formData.organizationId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=100', {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        const allOrgs = result.data || [];
        setOrganizations(allOrgs);

        // Filter organizations based on user role
        const isSuperAdmin = roles.includes('SUPER_ADMIN');
        if (isSuperAdmin) {
          setAvailableOrganizations(allOrgs);
        } else if (user?.organizationId) {
          const userOrg = allOrgs.filter((org: Organization) => org.id === Number(user.organizationId));
          setAvailableOrganizations(userOrg);
          // Pre-populate organization for non-super admin
          if (userOrg.length > 0) {
            setFormData(prev => ({
              ...prev,
              organizationId: userOrg[0].id.toString(),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const fetchDepartments = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/departments?organizationId=${organizationId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchJobTitles = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/job-titles?organizationId=${organizationId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setJobTitles(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch job titles:', error);
    }
  };

  const fetchManagers = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/employees?organizationId=${organizationId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setManagers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveClick = () => {
    const validationError = validateEmployeeForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    await performSave();
  };

  const performSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        organizationId: formData.organizationId,
        department_id: formData.department_id,
        job_title_id: formData.job_title_id,
        manager_id: formData.manager_id || undefined,
        email: formData.work_email, // Map work_email to required email field
        personal_email: formData.personal_email.trim() === '' ? null : formData.personal_email.trim(),
        date_of_birth: new Date(formData.date_of_birth),
        hire_date: new Date(formData.hire_date),
      };

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create employee');
      }

      const data = await response.json();
      // Show success modal instead of redirecting
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'TERMINATED', label: 'Terminated' },
    { value: 'ON_LEAVE', label: 'On Leave' },
  ];

  const organizationOptions = organizations.map(org => ({
    value: org.id.toString(),
    label: org.name,
  }));

  const departmentOptions = departments.map(dept => ({
    value: dept.id.toString(),
    label: dept.name,
  }));

  const jobTitleOptions = jobTitles.map(title => ({
    value: title.id.toString(),
    label: title.name,
  }));

  const managerOptions = [
    { value: '', label: 'No Manager' },
    ...managers.map(manager => ({
      value: manager.id.toString(),
      label: `${manager.first_name} ${manager.last_name}`,
    })),
  ];

  return (
    <>
      <PageMeta title='Employee Onboarding - HR Management System' description='Onboard a new employee' />
      <PageBreadcrumb
        pageTitle='Employee Onboarding'
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: 'Onboarding' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Onboard New Employee
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Fill in the employee information below to get started.
          </p>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800'>
            <p className='text-red-600 dark:text-red-400 text-sm'>{error}</p>
          </div>
        )}

        <EmployeeForm
          formData={formData}
          handleInputChange={handleInputChange}
          organizations={organizations}
          availableOrganizations={availableOrganizations}
          departments={departments}
          jobTitles={jobTitles}
          managers={managers}
          user={user}
          isEdit={false}
        />

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href='/employees'>
            <Button
              variant='outline'
              size='md'
              disabled={saving}
            >
              Cancel
            </Button>
          </Link>
          <Button
            variant='primary'
            size='md'
            onClick={handleSaveClick}
            disabled={saving}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            {saving ? 'Onboarding...' : 'Onboard Employee'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        isOpen={showConfirmModal}
        displayStyle='plain'
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Employee Onboarding"
        description="Please review the employee details before onboarding. Are you sure you want to proceed?"
        groupedDetails={grouped}
        confirmText="Confirm Onboard"
        cancelText="Cancel"
        isLoading={saving}
        size="wide"
      />

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => { setShowSuccessModal(false); setFormData(initialFormData); }}
        onConfirm={() => { setShowSuccessModal(false); router.push('/employees'); }}
        title="Employee Onboarded Successfully!"
        message="The employee has been added to the system."
        variant="success"
        confirmText="Go to Employee List"
        cancelText="Add Another Employee"
      />
    </>
  );
}
