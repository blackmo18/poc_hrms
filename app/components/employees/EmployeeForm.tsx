import Input from '@/app/components/form/input/InputField';
import Label from '@/app/components/form/Label';
import Select from '@/app/components/form/Select';
import DatePicker from '@/app/components/form/date-picker';

interface EmployeeFormData {
  organization_id: string;
  department_id: string;
  job_title_id: string;
  manager_id: string;
  custom_id: string; // Organization-specific custom employee ID
  first_name: string;
  last_name: string;
  work_email: string;
  work_contact: string;
  personal_address: string;
  personal_contact_number: string;
  personal_email: string;
  date_of_birth: string;
  gender: string;
  employment_status: string;
  hire_date: string;
}

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
}

interface EmployeeFormProps {
  formData: EmployeeFormData;
  handleInputChange: (field: string, value: string) => void;
  organizations: Organization[];
  availableOrganizations: Organization[];
  departments: Department[];
  jobTitles: JobTitle[];
  managers: Employee[];
  user?: any;
  isEdit?: boolean;
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'ON_LEAVE', label: 'On Leave' },
];

const organizationOptions = (organizations: Organization[]) => organizations.map(org => ({
  value: org.id.toString(),
  label: org.name,
}));

const departmentOptions = (departments: Department[]) => departments.map(dept => ({
  value: dept.id.toString(),
  label: dept.name,
}));

const jobTitleOptions = (jobTitles: JobTitle[]) => jobTitles.map(title => ({
  value: title.id.toString(),
  label: title.name,
}));

const managerOptions = (managers: Employee[]) => [
  { value: '', label: 'No Manager' },
  ...managers.map(manager => ({
    value: manager.id.toString(),
    label: `${manager.first_name} ${manager.last_name}`,
  })),
];

export default function EmployeeForm({
  formData,
  handleInputChange,
  organizations,
  availableOrganizations,
  departments,
  jobTitles,
  managers,
  user,
  isEdit = false,
}: EmployeeFormProps) {
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';

  return (
    <form className='space-y-6 mb-7'>
      {/* Organization Details Section */}
      <div className='border-b border-gray-200 dark:border-gray-700 pb-6'>
        <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Organization Details</h4>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <div>
            <Label>Organization {isEdit ? '' : '*'}</Label>
            {isEdit && !isSuperAdmin ? (
              <Input
                type='text'
                value={availableOrganizations.find(org => org.id.toString() === formData.organization_id)?.name || ''}
                disabled
                className='bg-gray-100 dark:bg-gray-800'
              />
            ) : (
              <Select
                options={organizationOptions(isEdit ? availableOrganizations : organizations)}
                value={formData.organization_id}
                onChange={(value) => handleInputChange('organization_id', value)}
                placeholder='Select organization'
                required={!isEdit}
              />
            )}
          </div>

          <div>
            <Label>Employee ID</Label>
            <Input
              type='text'
              value={formData.custom_id}
              onChange={(e) => handleInputChange('custom_id', e.target.value)}
              placeholder='Enter organization-specific employee ID (optional)'
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

          <div>
            <Label>Hire Date {isEdit ? '' : '*'}</Label>
            <DatePicker
              id="hire_date"
              mode="single"
              defaultDate={formData.hire_date}
              onChange={(dates) => {
                if (dates && dates.length > 0) {
                  const dateStr = dates[0].toISOString().split('T')[0];
                  handleInputChange('hire_date', dateStr);
                }
              }}
              placeholder="Select hire date"
            />
          </div>
        </div>
      </div>

      {/* Work Details Section */}
      <div className='border-b border-gray-200 dark:border-gray-700 pb-6'>
        <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Work Details</h4>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <div>
            <Label>Department {isEdit ? '' : '*'}</Label>
            <Select
              options={departmentOptions(departments)}
              value={formData.department_id}
              onChange={(value) => handleInputChange('department_id', value)}
              placeholder='Select department'
              disabled={!formData.organization_id}
              required={!isEdit}
            />
          </div>

          <div>
            <Label>Job Title {isEdit ? '' : '*'}</Label>
            <Select
              options={jobTitleOptions(jobTitles)}
              value={formData.job_title_id}
              onChange={(value) => handleInputChange('job_title_id', value)}
              placeholder='Select job title'
              disabled={!formData.organization_id}
              required={!isEdit}
            />
          </div>

          <div>
            <Label>Manager</Label>
            <Select
              options={managerOptions(managers)}
              value={formData.manager_id}
              onChange={(value) => handleInputChange('manager_id', value)}
              placeholder='Select manager (optional)'
              disabled={!formData.organization_id}
            />
          </div>

          <div>
            <Label>Work Email {isEdit ? '' : '*'}</Label>
            <Input
              type='email'
              value={formData.work_email}
              onChange={(e) => handleInputChange('work_email', e.target.value)}
              placeholder='Enter work email'
              required={!isEdit}
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
            <Label>First Name {isEdit ? '' : '*'}</Label>
            <Input
              type='text'
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder='Enter first name'
              required={!isEdit}
            />
          </div>

          <div>
            <Label>Last Name {isEdit ? '' : '*'}</Label>
            <Input
              type='text'
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder='Enter last name'
              required={!isEdit}
            />
          </div>

          <div>
            <Label>Personal Address {isEdit ? '' : '*'}</Label>
            <Input
              type='text'
              value={formData.personal_address}
              onChange={(e) => handleInputChange('personal_address', e.target.value)}
              placeholder='Enter personal address'
              required={!isEdit}
            />
          </div>

          <div>
            <Label>Personal Contact Number {isEdit ? '' : '*'}</Label>
            <Input
              type='text'
              value={formData.personal_contact_number}
              onChange={(e) => handleInputChange('personal_contact_number', e.target.value)}
              placeholder='Enter personal contact number'
              required={!isEdit}
            />
          </div>

          <div>
            <Label>Personal Email</Label>
            <Input
              type='email'
              value={formData.personal_email}
              onChange={(e) => handleInputChange('personal_email', e.target.value)}
              placeholder='Enter personal email (optional)'
            />
          </div>

          <div>
            <Label>Date of Birth {isEdit ? '' : '*'}</Label>
            <DatePicker
              id="date_of_birth"
              mode="single"
              dateOffset={-18}
              onChange={(dates) => {
                if (dates && dates.length > 0) {
                  const dateStr = dates[0].toISOString().split('T')[0];
                  handleInputChange('date_of_birth', dateStr);
                }
              }}
              placeholder="Select date of birth"
            />
          </div>

          <div>
            <Label>Gender {isEdit ? '' : '*'}</Label>
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
              required={!isEdit}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
