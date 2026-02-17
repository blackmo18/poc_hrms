'use client';

import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';

interface Organization {
  id: number;
  name: string;
}

interface JobTitleFormData {
  organizationId?: string;
  name: string;
  description: string;
}

interface JobTitleFormProps {
  formData: JobTitleFormData;
  onInputChange: (field: string, value: string) => void;
  availableOrganizations?: Organization[];
  user?: any;
  isEdit: boolean;
}

export default function JobTitleForm({
  formData,
  onInputChange,
  availableOrganizations = [],
  user,
  isEdit,
}: JobTitleFormProps) {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6'>
        {!isEdit && availableOrganizations.length > 0 && user && (
          <div>
            <Label>Organization *</Label>
            <RoleComponentWrapper
              roles={['SUPER_ADMIN']}
              fallback={
                <Input
                  type="text"
                  value={availableOrganizations.find(org => org.id.toString() === formData.organizationId)?.name || ''}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              }
            >
              <Select
                options={availableOrganizations.map(org => ({ value: org.id.toString(), label: org.name }))}
                placeholder="Select organization"
                onChange={(value) => onInputChange('organizationId', value)}
                value={formData.organizationId || ''}
                required
              />
            </RoleComponentWrapper>
          </div>
        )}

        <div>
          <Label htmlFor="name">Job Title Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter job title name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <TextArea
            value={formData.description}
            onChange={(value) => onInputChange('description', value)}
            placeholder="Enter job title description"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
