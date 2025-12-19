'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import PageMeta from '../../../components/common/PageMeta';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import EmployeeConfirmModal from '../../../components/employees/EmployeeConfirmModal';

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
  organization_id: number;
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

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    organization_id: '',
    department_id: '',
    job_title_id: '',
    manager_id: '',
    first_name: '',
    last_name: '',
    email: '',
    // Work details (optional)
    work_email: '',
    work_contact: '',
    // Personal details (required)
    personal_address: '',
    personal_contact_number: '',
    personal_email: '',
    date_of_birth: '',
    gender: '',
    employment_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE',
    hire_date: '',
  });

  // Initialize id from params
  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // Fetch employee data and related data
  useEffect(() => {
    if (!id) return;

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
          setOrganizations(orgResult.data || []);
        }

        // Fetch departments for the employee's organization
        const deptResponse = await fetch(`/api/departments?organization_id=${employeeData.organization_id}`, {
          credentials: 'include',
        });
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData);
        }

        // Fetch job titles for the employee's organization
        const jobResponse = await fetch(`/api/job-titles?organization_id=${employeeData.organization_id}`, {
          credentials: 'include',
        });
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJobTitles(jobData);
        }

        // Fetch managers for the employee's organization
        const managerResponse = await fetch(`/api/employees?organizationId=${employeeData.organization_id}`, {
          credentials: 'include',
        });
        if (managerResponse.ok) {
          const managerResult = await managerResponse.json();
          setManagers((managerResult.data || []).filter(m => m.id !== employeeData.id)); // Exclude self
        }

        // Pre-populate form
        setFormData({
          organization_id: employeeData.organization_id?.toString() || '',
          department_id: employeeData.department_id?.toString() || '',
          job_title_id: employeeData.job_title_id?.toString() || '',
          manager_id: employeeData.manager_id?.toString() || '',
          first_name: employeeData.first_name || '',
          last_name: employeeData.last_name || '',
          email: employeeData.email || '',
          // Work details (optional)
          work_email: employeeData.work_email || '',
          work_contact: employeeData.work_contact || '',
          // Personal details (required)
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
  }, [id]);

  // Update departments, job titles, and managers when organization changes
  useEffect(() => {
    if (formData.organization_id && formData.organization_id !== employee?.organization_id?.toString()) {
      const updateRelatedData = async () => {
        try {
          // Fetch departments
          const deptResponse = await fetch(`/api/departments?organization_id=${formData.organization_id}`, {
            credentials: 'include',
          });
          if (deptResponse.ok) {
            const deptData = await deptResponse.json();
            setDepartments(deptData);
          }

          // Fetch job titles
          const jobResponse = await fetch(`/api/job-titles?organization_id=${formData.organization_id}`, {
            credentials: 'include',
          });
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            setJobTitles(jobData);
          }

          // Fetch managers
          const managerResponse = await fetch(`/api/employees?organizationId=${formData.organization_id}`, {
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
  }, [formData.organization_id, employee?.id, employee?.organization_id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveClick = () => {
    // Basic validation
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields');
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
        organization_id: Number(formData.organization_id),
        department_id: Number(formData.department_id),
        job_title_id: Number(formData.job_title_id),
        manager_id: formData.manager_id ? Number(formData.manager_id) : undefined,
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

      // Redirect back to employees page
      router.push('/employees');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
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

        <form className='space-y-6 mb-7'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <div>
              <Label>Organization *</Label>
              <Select
                options={organizationOptions}
                value={formData.organization_id}
                onChange={(value) => handleInputChange('organization_id', value)}
                placeholder='Select organization'
                required
              />
            </div>

            <div>
              <Label>Department *</Label>
              <Select
                options={departmentOptions}
                value={formData.department_id}
                onChange={(value) => handleInputChange('department_id', value)}
                placeholder='Select department'
                disabled={!formData.organization_id}
                required
              />
            </div>

            <div>
              <Label>Job Title *</Label>
              <Select
                options={jobTitleOptions}
                value={formData.job_title_id}
                onChange={(value) => handleInputChange('job_title_id', value)}
                placeholder='Select job title'
                disabled={!formData.organization_id}
                required
              />
            </div>

            <div>
              <Label>Manager</Label>
              <Select
                options={managerOptions}
                value={formData.manager_id}
                onChange={(value) => handleInputChange('manager_id', value)}
                placeholder='Select manager (optional)'
                disabled={!formData.organization_id}
              />
            </div>

            <div>
              <Label>First Name *</Label>
              <Input
                type='text'
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder='Enter first name'
                required
              />
            </div>

            <div>
              <Label>Last Name *</Label>
              <Input
                type='text'
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder='Enter last name'
                required
              />
            </div>

            <div>
              <Label>Email Address *</Label>
              <Input
                type='email'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder='Enter email address'
                required
              />
            </div>

            <div>
              <Label>Hire Date *</Label>
              <Input
                type='date'
                value={formData.hire_date}
                onChange={(e) => handleInputChange('hire_date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Employment Status</Label>
              <Select
                options={statusOptions}
                value={formData.employment_status}
                onChange={(value) => handleInputChange('employment_status', value)}
                placeholder='Select status'
              />
            </div>
          </div>

          {/* Work Details Section */}
          <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Work Details</h4>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <div>
                <Label>Work Email</Label>
                <Input
                  type='email'
                  value={formData.work_email}
                  onChange={(e) => handleInputChange('work_email', e.target.value)}
                  placeholder='Enter work email (optional)'
                />
              </div>

              <div>
                <Label>Work Contact</Label>
                <Input
                  type='text'
                  value={formData.work_contact}
                  onChange={(e) => handleInputChange('work_contact', e.target.value)}
                  placeholder='Enter work contact number (optional)'
                />
              </div>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
            <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Personal Details</h4>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <div>
                <Label>Personal Address *</Label>
                <Input
                  type='text'
                  value={formData.personal_address}
                  onChange={(e) => handleInputChange('personal_address', e.target.value)}
                  placeholder='Enter personal address'
                  required
                />
              </div>

              <div>
                <Label>Personal Contact Number *</Label>
                <Input
                  type='text'
                  value={formData.personal_contact_number}
                  onChange={(e) => handleInputChange('personal_contact_number', e.target.value)}
                  placeholder='Enter personal contact number'
                  required
                />
              </div>

              <div>
                <Label>Personal Email *</Label>
                <Input
                  type='email'
                  value={formData.personal_email}
                  onChange={(e) => handleInputChange('personal_email', e.target.value)}
                  placeholder='Enter personal email'
                  required
                />
              </div>

              <div>
                <Label>Date of Birth *</Label>
                <Input
                  type='date'
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Gender *</Label>
                <Select
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                    { value: 'Prefer not to say', label: 'Prefer not to say' },
                  ]}
                  value={formData.gender}
                  onChange={(value) => handleInputChange('gender', value)}
                  placeholder='Select gender'
                  required
                />
              </div>
            </div>
          </div>
        </form>

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
      <EmployeeConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        employeeData={formData}
        organizations={organizations}
        departments={departments}
        jobTitles={jobTitles}
        managers={managers}
        isSaving={saving}
      />
    </>
  );
}
