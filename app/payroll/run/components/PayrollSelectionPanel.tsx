interface PayrollSelectionPanelProps {
  selectedCutoff: string;
  onCutoffChange: (value: string) => void;
  payrollPeriods: Array<{ value: string; label: string }>;
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

      {/* Department Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Department</label>
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          disabled={isLoadingDepartments}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          <option value="">Select department...</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        {isLoadingDepartments && (
          <p className="mt-1 text-xs text-gray-500">Loading departments...</p>
        )}
      </div>
    </div>
  );
}
