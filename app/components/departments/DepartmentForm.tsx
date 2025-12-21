'use client';

import Input from '@/app/components/form/input/InputField';
import TextArea from '@/app/components/form/input/TextArea';
import Label from '@/app/components/form/Label';
import Select from '@/app/components/form/Select';
import RoleComponentWrapper from '@/app/components/common/RoleComponentWrapper';

interface Organization {
  id: number;
  name: string;
}

interface DepartmentFormData {
  organization_id?: string;
  name: string;
  description: string;
}

interface DepartmentFormProps {
  formData: DepartmentFormData;
  onInputChange: (field: string, value: string) => void;
  availableOrganizations?: Organization[];
  user?: any;
  isEdit: boolean;
}

export default function DepartmentForm({
  formData,
  onInputChange,
  availableOrganizations = [],
  user,
  isEdit,
}: DepartmentFormProps) {
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
                  value={availableOrganizations.find(org => org.id.toString() === formData.organization_id)?.name || ''}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                />
              }
            >
              <Select
                options={availableOrganizations.map(org => ({ value: org.id.toString(), label: org.name }))}
                placeholder="Select organization"
                onChange={(value) => onInputChange('organization_id', value)}
                value={formData.organization_id || ''}
                required
              />
            </RoleComponentWrapper>
          </div>
        )}

        <div>
          <Label htmlFor="name">Department Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter department name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <TextArea
            value={formData.description}
            onChange={(value) => onInputChange('description', value)}
            placeholder="Enter department description"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
