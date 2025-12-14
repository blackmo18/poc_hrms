'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import OrganizationConfirmModal from '../../components/organizations/OrganizationConfirmModal';

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveClick = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
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

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organization');
      }

      const data = await response.json();
      // Redirect to organization details page
      router.push(`/organizations/details/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ];

  return (
    <>
      <PageMeta title='Organization Onboarding - HR Management System' description='Create a new organization' />
      <PageBreadcrumb
        pageTitle='Organization Onboarding'
        breadcrumbs={[
          { label: 'Onboarding' }
        ]}
      />

      <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6'>
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90'>
            Create New Organization
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Fill in the organization information below to get started.
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
          <Link href='/organizations/details'>
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
            {saving ? 'Boarding...' : 'Onboard Organization'}
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