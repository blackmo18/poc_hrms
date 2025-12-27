'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PageMeta from '@/components/common/PageMeta';
import Button from '@/components/ui/button/Button';
import { useAuth } from '@/components/providers/auth-provider';
import DetailsConfirmationModal from '@/components/ui/modal/DetailsConfirmationModal';
import ErrorModal from '@/components/ui/modal/ErrorModal';
import JobTitleForm from '@/components/job-titles/JobTitleForm';

interface JobTitle {
  id: number;
  name: string;
  description?: string;
  organization: {
    id: number;
    name: string;
  };
}

export default function EditJobTitlePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobTitleId = params.id as string;

  const [jobTitle, setJobTitle] = useState<JobTitle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && jobTitleId) {
      fetchJobTitle();
    }
  }, [isLoading, user, jobTitleId, router]);

  const fetchJobTitle = async () => {
    try {
      const response = await fetch(`/api/job-titles/${jobTitleId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setJobTitle(data);
        setFormData({
          name: data.name,
          description: data.description || '',
        });
      } else if (response.status === 404) {
        setErrorMessage('Job title not found');
        setShowErrorModal(true);
        setTimeout(() => router.push('/job-titles'), 2000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to load job title');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error fetching job title:', error);
      setErrorMessage('An error occurred while loading job title');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!formData.name.trim()) {
      setErrorMessage('Job title name is required');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/job-titles/${jobTitleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowConfirmModal(false);
        router.push('/job-titles');
      } else {
        const error = await response.json();
        setShowConfirmModal(false);
        setErrorMessage(error.error || 'Failed to update job title');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating job title:', error);
      setShowConfirmModal(false);
      setErrorMessage('An error occurred while updating job title');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading job title...</div>
        </div>
      </div>
    );
  }

  if (!jobTitle) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error</div>
            <div className="text-gray-600 dark:text-gray-300">Job title not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title='Edit Job Title - HR Management System' description='Edit job title details and information' />
      <PageBreadcrumb
        pageTitle='Edit Job Title'
        breadcrumbs={[
          { label: 'Job Titles', href: '/job-titles' },
          { label: 'Edit' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Edit Job Title Details
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Update the job title information below.
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            Organization: {jobTitle.organization.name}
          </p>
        </div>

        <form className='space-y-6 mb-7'>
          <JobTitleForm
            formData={formData}
            onInputChange={handleInputChange}
            isEdit={true}
          />
        </form>

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href="/job-titles">
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
            {saving ? 'Updating...' : 'Update Job Title'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DetailsConfirmationModal
        size='wider'
        displayStyle='plain'
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Job Title Update"
        description="Please review the job title details before saving."
        details={[
          { label: 'Organization', value: jobTitle?.organization.name || 'Unknown' },
          { label: 'Job Title Name', value: formData.name },
          { label: 'Description', value: formData.description || 'No description' },
        ]}
        confirmText={saving ? 'Updating...' : 'Update Job Title'}
        cancelText="Cancel"
        isLoading={saving}
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
