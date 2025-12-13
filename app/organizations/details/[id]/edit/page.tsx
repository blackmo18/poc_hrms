'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Organization } from '@/lib/models/organization';
import PageBreadcrumb from '../../../../components/common/PageBreadCrumb';
import PageMeta from '../../../../components/common/PageMeta';
import Button from '../../../../components/ui/button/Button';
import { Modal } from '../../../../components/ui/modal';
import Input from '../../../../components/form/input/InputField';
import Label from '../../../../components/form/Label';
import Select from '../../../../components/form/Select';
import OrganizationConfirmModal from '../../../../components/organizations/OrganizationConfirmModal';

interface EditOrganizationPageProps {
  params: Promise<{ id: string }>;
}

export default function EditOrganizationPage({ params }: EditOrganizationPageProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_number: '',
    address: '',
    website: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  });

  // Initialize id from params
  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // Fetch organization data
  useEffect(() => {
    if (!id) return;

    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/organizations/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        setOrganization(data);

        // Pre-populate form
        setFormData({
          name: data.name || '',
          email: data.email || '',
          contact_number: data.contact_number || '',
          address: data.address || '',
          website: data.website || '',
          description: data.description || '',
          status: data.status || 'ACTIVE',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    await performSave();
  };

  const performSave = async () => {
    if (!organization) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update organization');
      }

      // Redirect back to organization details
      router.push(`/organizations/details/${organization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ];

  if (loading) {
    return (
      <>
        <PageMeta title='Edit Organization - HR Management System' description='Edit organization details and information' />
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600 dark:text-gray-400'>Loading organization...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !organization) {
    return (
      <>
        <PageMeta title='Edit Organization - HR Management System' description='Edit organization details and information' />
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <p className='text-red-600 dark:text-red-400'>{error}</p>
            <Link href={`/organizations/details/${id}`}>
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
      <PageMeta title={`Edit ${organization?.name || 'Organization'} - HR Management System`} description={`Edit ${organization?.name || 'Organization'} details and information`} />
      <PageBreadcrumb
        pageTitle='Edit Organization'
        breadcrumbs={[
          { label: 'Details', href: `/organizations/details/${organization?.id}` },
          { label: 'Edit' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Edit Organization Details
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Update the organization information below.
          </p>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800'>
            <p className='text-red-600 dark:text-red-400 text-sm'>{error}</p>
          </div>
        )}

        <form className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <div>
              <Label>Organization Name *</Label>
              <Input
                type='text'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder='Enter organization name'
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
              <Label>Contact Number</Label>
              <Input
                type='text'
                value={formData.contact_number}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                placeholder='Enter contact number'
              />
            </div>

            <div>
              <Label>Website</Label>
              <Input
                type='url'
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder='https://example.com'
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                placeholder='Select status'
              />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input
              type='text'
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder='Enter address'
            />
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder='Enter organization description'
              rows={4}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white'
            />
          </div>
        </form>

        <div className='flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <Link href={`/organizations/details/${organization?.id}`}>
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
      <OrganizationConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        organizationData={formData}
        isSaving={saving}
      />
    </>
  );
}