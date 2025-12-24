'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '@/app/components/common/PageBreadCrumb';
import PageMeta from '@/app/components/common/PageMeta';
import Button from '@/app/components/ui/button/Button';
import Input from '@/app/components/form/input/InputField';
import TextArea from '@/app/components/form/input/TextArea';
import Label from '@/app/components/form/Label';
import Select from '@/app/components/form/Select';
import { useAuth } from '@/app/components/providers/auth-provider';
import DetailsConfirmationModal from '@/app/components/ui/modal/DetailsConfirmationModal';
import ErrorModal from '@/app/components/ui/modal/ErrorModal';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';
import JobTitleForm from '@/app/components/job-titles/JobTitleForm';

interface Organization {
  id: number;
  name: string;
}

export default function AddJobTitlePage() {
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
      const response = await fetch('/api/job-titles', {
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
        router.push('/job-titles');
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Unknown error occurred');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error creating job title:', error);
      setErrorMessage('An error occurred while creating job title');
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
      <PageMeta title='Add Job Title - HR Management System' description='Add a new job title to the system' />
      <PageBreadcrumb
        pageTitle='Add Job Title'
        breadcrumbs={[
          { label: 'Job Titles', href: '/job-titles' },
          { label: 'Add' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Add New Job Title
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Add a new job title to the system.
          </p>
        </div>

        <form className='space-y-6 mb-7'>
          <JobTitleForm
            formData={formData}
            onInputChange={handleInputChange}
            availableOrganizations={availableOrganizations}
            user={user}
            isEdit={false}
          />
        </form>

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href="/job-titles">
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
            {loading ? 'Creating...' : 'Create Job Title'}
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
        title="Confirm Job Title Creation"
        description="Please review the job title details before creating."
        details={[
          { label: 'Organization', value: availableOrganizations.find(org => org.id.toString() === formData.organization_id)?.name || 'Unknown' },
          { label: 'Job Title Name', value: formData.name },
          { label: 'Description', value: formData.description || 'No description' },
        ]}
        confirmText={loading ? 'Creating...' : 'Create Job Title'}
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
