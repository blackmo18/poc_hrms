import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import Select from '@/components/form/Select';

export interface OrganizationFilterProps {
  selectedOrganization: string | null;
  organizationOptions: Array<{ value: string; label: string }>;
  onOrganizationChange: (orgId: string | null) => void;
  disabled?: boolean;
  className?: string;
  showAllOption?: boolean; // Whether to show "All Organizations" option
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
  className = "max-w-md mb-6",
  showAllOption = true
}: OrganizationFilterProps) {
  // Build options array based on showAllOption flag
  const selectOptions = showAllOption 
    ? [{ value: '', label: 'All Organizations' }, ...organizationOptions]
    : organizationOptions;

  return (
    <div className={className}>
      <label htmlFor="organization-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Filter by Organization
      </label>
      <Select
        options={selectOptions}
        value={selectedOrganization || ''}
        onChange={(value) => onOrganizationChange(value || null)}
        placeholder="Select an organization"
        disabled={disabled}
      />
    </div>
  );
}
