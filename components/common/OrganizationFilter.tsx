import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import Select from '@/components/form/Select';

export interface OrganizationFilterProps {
  selectedOrganization: string | null;
  organizationOptions: Array<{ value: string; label: string }>;
  onOrganizationChange: (orgId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable organization filter component
 * Provides consistent UI for organization-based filtering across pages
 */
export default function OrganizationFilter({
  selectedOrganization,
  organizationOptions,
  onOrganizationChange,
  disabled = false,
  className = "max-w-md mb-6"
}: OrganizationFilterProps) {
  return (
    <div className={className}>
      <label htmlFor="organization-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Filter by Organization
      </label>
      <Select
        options={[
          { value: '', label: 'All Organizations' },
          ...organizationOptions
        ]}
        value={selectedOrganization || ''}
        onChange={(value) => onOrganizationChange(value || null)}
        placeholder="Select an organization"
        disabled={disabled}
      />
    </div>
  );
}
