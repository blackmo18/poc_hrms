'use client';

import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';

interface OrganizationFormData {
  name: string;
  email: string;
  contact_number: string;
  address: string;
  website: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface OrganizationFormProps {
  formData: OrganizationFormData;
  onInputChange: (field: string, value: string) => void;
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function OrganizationForm({ formData, onInputChange }: OrganizationFormProps) {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <div>
          <Label>Organization Name *</Label>
          <Input
            type='text'
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder='Enter organization name'
            required
          />
        </div>

        <div>
          <Label>Email Address *</Label>
          <Input
            type='email'
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder='Enter email address'
            required
          />
        </div>

        <div>
          <Label>Contact Number</Label>
          <Input
            type='text'
            value={formData.contact_number}
            onChange={(e) => onInputChange('contact_number', e.target.value)}
            placeholder='Enter contact number'
          />
        </div>

        <div>
          <Label>Website</Label>
          <Input
            type='url'
            value={formData.website}
            onChange={(e) => onInputChange('website', e.target.value)}
            placeholder='https://example.com'
          />
        </div>

        <div>
          <Label>Status</Label>
          <Select
            options={statusOptions}
            value={formData.status}
            onChange={(value) => onInputChange('status', value)}
            placeholder='Select status'
          />
        </div>
      </div>

      <div>
        <Label>Address</Label>
        <Input
          type='text'
          value={formData.address}
          onChange={(e) => onInputChange('address', e.target.value)}
          placeholder='Enter address'
        />
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder='Enter organization description'
          rows={4}
          className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white'
        />
      </div>
    </div>
  );
}
