interface PayrollSelectionPanelProps {
  selectedCutoff: string;
  onCutoffChange: (value: string) => void;
  payrollPeriods: Array<{ value: string; label: string }>;
  selectedOrganization: string;
  organizationOptions: Array<{ value: string; label: string }>;
  onOrganizationChange: (value: string) => void;
  isOrganizationFilterLoading: boolean;
  showAllOption: boolean;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  departments: Array<{ id: string; name: string }>;
  isLoadingDepartments: boolean;
  userOrganizationId?: string;
}

export function PayrollSelectionPanel({
  selectedCutoff,
  onCutoffChange,
  payrollPeriods,
  selectedOrganization,
  organizationOptions,
  onOrganizationChange,
  isOrganizationFilterLoading,
  showAllOption,
  selectedDepartment,
  onDepartmentChange,
  departments,
  isLoadingDepartments,
  userOrganizationId,
}: PayrollSelectionPanelProps) {
  return (
    <div className="space-y-6">
      {/* Cutoff Period Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Cutoff Period</label>
        <select
          value={selectedCutoff}
          onChange={(e) => onCutoffChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Select cutoff period...</option>
          {payrollPeriods.map(period => (
            <option key={period.value} value={period.value}>{period.label}</option>
          ))}
        </select>
      </div>

      {/* Organization Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Organization</label>
        <select
          value={selectedOrganization}
          onChange={(e) => onOrganizationChange(e.target.value)}
          disabled={isOrganizationFilterLoading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          <option value="">Select organization...</option>
          {organizationOptions.map(org => (
            <option key={org.value} value={org.value}>{org.label}</option>
          ))}
        </select>
        {isOrganizationFilterLoading && (
          <p className="mt-1 text-xs text-gray-500">Loading organizations...</p>
        )}
      </div>

      {/* Department Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Department</label>
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          disabled={!selectedOrganization && !userOrganizationId || isLoadingDepartments}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          <option value="">Select department...</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        {(!selectedOrganization && !userOrganizationId) && (
          <p className="mt-1 text-xs text-gray-500">Please select an organization first</p>
        )}
        {isLoadingDepartments && (
          <p className="mt-1 text-xs text-gray-500">Loading departments...</p>
        )}
      </div>
    </div>
  );
}
