interface PayrollSummaryResultsProps {
  summary: {
    employees: {
      total: number;
      eligible: number;
      ineligible: number;
      exclusionReasons: {
        missingSalaryConfig: number;
        missingAttendance: number;
      };
    };
    attendance: {
      complete: boolean;
      missingEmployeesCount: number;
    };
    overtime: {
      totalRequests: number;
      approvedCount: number;
      pendingCount: number;
    };
    readiness: {
      canGenerate: boolean;
      warnings: string[];
    };
  };
  onMissingAttendanceClick?: () => void;
}

export function PayrollSummaryResults({ summary, onMissingAttendanceClick }: PayrollSummaryResultsProps) {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <h3 className="font-medium text-sm mb-3 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        Payroll Summary Generated
      </h3>

      {/* Employee Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Employees</p>
          <p className="text-lg font-semibold">{summary.employees.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <p className="text-xs text-gray-600 dark:text-gray-400">Eligible</p>
          <p className="text-lg font-semibold text-green-600">{summary.employees.eligible}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <p className="text-xs text-gray-600 dark:text-gray-400">Ineligible</p>
          <p className="text-lg font-semibold text-red-600">{summary.employees.ineligible}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <p className="text-xs text-gray-600 dark:text-gray-400">Attendance Complete</p>
          <p className={`text-lg font-semibold ${summary.attendance.complete ? 'text-green-600' : 'text-red-600'}`}>
            {summary.attendance.complete ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      {/* Exclusion Reasons */}
      {summary.employees.exclusionReasons.missingSalaryConfig > 0 && (
        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠ {summary.employees.exclusionReasons.missingSalaryConfig} employees missing salary configuration
          </p>
        </div>
      )}

      {/* Attendance Issues */}
      {!summary.attendance.complete && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <button
            onClick={onMissingAttendanceClick}
            className="text-xs text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-300 cursor-pointer underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1 py-0.5"
          >
            ❌ {summary.attendance.missingEmployeesCount} employees missing attendance records
          </button>
        </div>
      )}

      {/* Overtime Summary */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overtime Requests</p>
        <div className="flex gap-4 text-sm">
          <span>Total: <strong>{summary.overtime.totalRequests}</strong></span>
          <span>Approved: <strong className="text-green-600">{summary.overtime.approvedCount}</strong></span>
          <span>Pending: <strong className="text-yellow-600">{summary.overtime.pendingCount}</strong></span>
        </div>
      </div>

      {/* Readiness Status */}
      <div className={`p-2 rounded border ${
        summary.readiness.canGenerate
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <p className={`text-xs font-medium ${
          summary.readiness.canGenerate
            ? 'text-green-800 dark:text-green-200'
            : 'text-red-800 dark:text-red-200'
        }`}>
          {summary.readiness.canGenerate ? '✅ Ready to Generate' : '❌ Cannot Generate Payroll'}
        </p>
        {summary.readiness.warnings.length > 0 && (
          <ul className="text-xs mt-1 space-y-1">
            {summary.readiness.warnings.map((warning: string, index: number) => (
              <li key={index} className="text-yellow-700 dark:text-yellow-300">⚠ {warning}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
