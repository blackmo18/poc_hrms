'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
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
}

interface JobTitle {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employment_status: string;
  hire_date: string;
  organizationId: number;
  department_id: number;
  job_title_id: number;
  manager_id?: number;
  organization: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  jobTitle: {
    id: number;
    name: string;
  };
  manager?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const { roles } = useRoleAccess();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    organizationId: '',
    department_id: '',
    job_title_id: '',
    manager_id: '',
    custom_id: '', // Organization-specific employee ID
    first_name: '',
    last_name: '',
    // Work details (required work email)
    work_email: '',
    work_contact: '',
    // Personal details (required except personal_email)
    personal_address: '',
    personal_contact_number: '',
    personal_email: '',
    date_of_birth: '',
    gender: '',
    employment_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE',
    hire_date: '',
  });

  // Grouped details for confirmation
  const grouped = getEmployeeGroupedDetails(formData, organizations, departments, jobTitles, managers);

  // Fetch employee data and related data
  useEffect(() => {
    if (!id) return;
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch employee data
        const employeeResponse = await fetch(`/api/employees/${id}`, {
          credentials: 'include',
        });

        if (!employeeResponse.ok) {
          throw new Error('Failed to fetch employee');
        }

        const employeeData = await employeeResponse.json();
        setEmployee(employeeData);

        // Fetch organizations
        const orgResponse = await fetch('/api/organizations', {
          credentials: 'include',
        });
        if (orgResponse.ok) {
          const orgResult = await orgResponse.json();
          const allOrgs = orgResult.data || [];
          setOrganizations(allOrgs);

          // Filter organizations based on user role
          const isSuperAdmin = roles.includes('SUPER_ADMIN');
          if (isSuperAdmin) {
            setAvailableOrganizations(allOrgs);
          } else if (user?.organizationId) {
            const userOrg = allOrgs.filter((org: Organization) => org.id === Number(user.organizationId));
            setAvailableOrganizations(userOrg);
          }
        }

        // Fetch departments for the employee's organization
        const deptResponse = await fetch(`/api/departments?organizationId=${employeeData.organizationId}`, {
          credentials: 'include',
        });
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.data || []);
        }

        // Fetch job titles for the employee's organization
        const jobResponse = await fetch(`/api/job-titles?organizationId=${employeeData.organizationId}`, {
          credentials: 'include',
        });
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJobTitles(jobData.data || jobData || []);
        }

        // Fetch managers for the employee's organization
        const managerResponse = await fetch(`/api/employees?organizationId=${employeeData.organizationId}`, {
          credentials: 'include',
        });
        if (managerResponse.ok) {
          const managerResult = await managerResponse.json();
          setManagers((managerResult.data || []).filter(m => m.id !== employeeData.id)); // Exclude self
        }

        // Pre-populate form
        setFormData({
          organizationId: employeeData.organizationId?.toString() || '',
          department_id: employeeData.department_id?.toString() || '',
          job_title_id: employeeData.job_title_id?.toString() || '',
          manager_id: employeeData.manager_id?.toString() || '',
          custom_id: employeeData.custom_id || '', // Organization-specific employee ID
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          // Work details (required work email)
          work_email: employeeData.email || '', // Map existing email to work_email
          work_contact: employeeData.work_contact || '',
          // Personal details (required except personal_email)
          personal_address: employeeData.personal_address || '',
          personal_contact_number: employeeData.personal_contact_number || '',
          personal_email: employeeData.personal_email || '',
          date_of_birth: employeeData.date_of_birth ? new Date(employeeData.date_of_birth).toISOString().split('T')[0] : '',
          gender: employeeData.gender || '',
          employment_status: employeeData.employment_status || 'ACTIVE',
          hire_date: employeeData.hire_date ? new Date(employeeData.hire_date).toISOString().split('T')[0] : '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, authLoading, user, router]);

  // Update departments, job titles, and managers when organization changes
  useEffect(() => {
    if (formData.organizationId && formData.organizationId !== employee?.organizationId?.toString()) {
      const updateRelatedData = async () => {
        try {
          // Fetch departments
          const deptResponse = await fetch(`/api/departments?organizationId=${formData.organizationId}`, {
            credentials: 'include',
          });
          if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            setDepartments(deptData.data || []);
          }

          // Fetch job titles
          const jobResponse = await fetch(`/api/job-titles?organizationId=${formData.organizationId}`, {
            credentials: 'include',
          });
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            setJobTitles(jobData.data || jobData || []);
          }

          // Fetch managers
          const managerResponse = await fetch(`/api/employees?organizationId=${formData.organizationId}`, {
            credentials: 'include',
          });
          if (managerResponse.ok) {
            const managerResult = await managerResponse.json();
            setManagers((managerResult.data || []).filter(m => m.id !== employee?.id));
          }
        } catch (error) {
          console.error('Failed to fetch related data:', error);
        }
      };

      updateRelatedData();
    }
  }, [formData.organizationId, employee?.id, employee?.organizationId]);

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
    if (!employee) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        organizationId: formData.organizationId,
        department_id: formData.department_id,
        job_title_id: formData.job_title_id,
        manager_id: formData.manager_id ? Number(formData.manager_id) : undefined,
        email: formData.work_email, // Map work_email to required email field
        personal_email: formData.personal_email.trim() === '' ? null : formData.personal_email.trim(),
        date_of_birth: new Date(formData.date_of_birth),
        hire_date: new Date(formData.hire_date),
      };

      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee');
      }

      const data = await response.json();
      // Show success modal instead of redirecting
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
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

  const organizationOptions = (organizations || []).map(org => ({
    value: org.id.toString(),
    label: org.name,
  }));

  const departmentOptions = (departments || []).map(dept => ({
    value: dept.id.toString(),
    label: dept.name,
  }));

  const jobTitleOptions = (jobTitles || []).map(title => ({
    value: title.id.toString(),
    label: title.name,
  }));

  const managerOptions = [
    { value: '', label: 'No Manager' },
    ...(managers || []).map(manager => ({
      value: manager.id.toString(),
      label: `${manager.first_name} ${manager.last_name}`,
    })),
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg text-gray-600 dark:text-gray-300'>Loading...</div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <>
        <PageMeta title='Edit Employee - HR Management System' description='Edit employee details and information' />
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <p className='text-red-600 dark:text-red-400'>{error}</p>
            <Link href='/employees'>
              <Button className='mt-4'>
                Go Back
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Edit ${employee ? `${employee.first_name} ${employee.last_name}` : 'Employee'} - HR Management System`} description={`Edit employee details and information`} />
      <PageBreadcrumb
        pageTitle='Edit Employee'
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: 'Edit' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Edit Employee Details
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Update the employee information below.
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
          isEdit={true}
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
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        isOpen={showConfirmModal}
        displayStyle='plain'
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title='Confirm Employee Update'
        description='Please review the employee details before updating. Are you sure you want to proceed?'
        groupedDetails={grouped}
        confirmText='Confirm Update'
        cancelText='Cancel'
        isLoading={saving}
        size='wide'
      />

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        size='wide'
        onClose={() => { setShowSuccessModal(false); }}
        onConfirm={() => { setShowSuccessModal(false); router.push('/employees'); }}
        title='Employee Updated Successfully!'
        message='The employee details have been updated successfully.'
        variant='success'
        confirmText='Go to Employee List'
        cancelText='Close'
      />
    </>
  );
}
