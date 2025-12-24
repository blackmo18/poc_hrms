'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import PageMeta from '@/app/components/common/PageMeta';
import Button from '@/app/components/ui/button/Button';
import { useAuth } from '@/app/components/providers/auth-provider';
import DetailsConfirmationModal from '@/app/components/ui/modal/DetailsConfirmationModal';
import ErrorModal from '@/app/components/ui/modal/ErrorModal';
import DepartmentForm from '@/app/components/departments/DepartmentForm';

interface Organization {
  id: number;
  name: string;
}

export default function AddDepartmentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    organization_id: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      fetchOrganizations();
    }
  }, [isLoading, user, router]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=100', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setOrganizations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  // Filter organizations based on user role
  useEffect(() => {
    if (organizations.length > 0 && user) {
      const isSuperAdmin = user.roles?.includes('SUPER_ADMIN') || user.role === 'SUPER_ADMIN';
      if (isSuperAdmin) {
        setAvailableOrganizations(organizations);
      } else {
        // Non-super admin users only see their organization
        const userOrg = organizations.filter(org => org.id === Number(user.organization_id));
        setAvailableOrganizations(userOrg);
        // Pre-populate the organization_id for non-super admin users
        if (user.organization_id) {
          setFormData(prev => ({ ...prev, organization_id: user.organization_id!.toString() }));
        }
      }
    }
  }, [organizations, user]);

  const handleCreateClick = () => {
    // Basic validation
    if (!formData.organization_id || !formData.name.trim()) {
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
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          organization_id: Number(formData.organization_id),
        }),
      });

      if (response.ok) {
        router.push('/departments');
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Unknown error occurred');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating department:', error);
      setErrorMessage('An error occurred while creating department');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <>
      <PageMeta title='Add Department - HR Management System' description='Add a new department to the system' />
      <PageBreadcrumb
        pageTitle='Add Department'
        breadcrumbs={[
          { label: 'Departments', href: '/departments' },
          { label: 'Add' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Add New Department
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Add a new department to the system.
          </p>
        </div>

        <form className='space-y-6 mb-7'>
          <DepartmentForm
            formData={formData}
            onInputChange={handleInputChange}
            availableOrganizations={availableOrganizations}
            user={user}
            isEdit={false}
          />
        </form>

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href="/departments">
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
            {loading ? 'Creating...' : 'Create Department'}
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
        title="Confirm Department Creation"
        description="Please review the department details before creating."
        details={[
          { label: 'Organization', value: availableOrganizations.find(org => org.id.toString() === formData.organization_id)?.name || 'Unknown' },
          { label: 'Department Name', value: formData.name },
          { label: 'Description', value: formData.description || 'No description' },
        ]}
        confirmText={loading ? 'Creating...' : 'Create Department'}
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
