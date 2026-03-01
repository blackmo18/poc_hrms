'use client';

import { useEffect } from 'react';

interface PayrollSummaryResultsProps {
  summary: {
    employees: {
      total: number;
      eligible: number;
      ineligible: number;
      eligibleEmployees?: Array<{
        id: string;
        employeeId: string;
        firstName: string;
        lastName: string;
        departmentName?: string;
        baseSalary: number;
        hasAttendance: boolean;
        hasWorkSchedule: boolean;
        lateMinutes: number;
        absenceCount: number;
      }>;
      exclusionReasons: {
        missingSalaryConfig: number;
        missingAttendance: number;
        missingWorkSchedule: number;
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
    payrollStatus: {
      currentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
      lastGeneratedAt?: string;
      hasExistingRun: boolean;
    };
    deductions?: {
      totals: {
        tax: number;
        philhealth: number;
        sss: number;
        pagibig: number;
        late: number;
        absence: number;
        total: number;
      };
      breakdown: {
        government: number;
        policy: number;
      };
    };
    metrics?: {
      lateness: {
        totalLateInstances: number;
        totalLateMinutes: number;
        affectedEmployees: number;
      };
      absence: {
        totalAbsences: number;
        affectedEmployees: number;
      };
      undertime: {
        totalUndertimeMinutes: number;
        affectedEmployees: number;
      };
    };
  };
  onMissingAttendanceClick?: () => void;
}

export function PayrollSummaryResults({ summary, onMissingAttendanceClick }: PayrollSummaryResultsProps) {
  // Pass the eligible employees data to parent via custom event or callback
  useEffect(() => {
    // Store the eligible employees in a global state or pass to parent
    if (summary.employees.eligibleEmployees) {
      // This will be used by the parent component
      window.dispatchEvent(new CustomEvent('payrollSummaryGenerated', { 
        detail: { eligibleEmployees: summary.employees.eligibleEmployees } 
      }));
    }
  }, [summary.employees.eligibleEmployees]);

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
      {(summary.employees.exclusionReasons.missingSalaryConfig > 0 || 
        summary.employees.exclusionReasons.missingWorkSchedule > 0) && (
        <div className="mb-3 space-y-2">
          {summary.employees.exclusionReasons.missingSalaryConfig > 0 && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠ {summary.employees.exclusionReasons.missingSalaryConfig} employees missing salary configuration
              </p>
            </div>
          )}
          {summary.employees.exclusionReasons.missingWorkSchedule > 0 && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠ {summary.employees.exclusionReasons.missingWorkSchedule} employees missing work schedule
              </p>
            </div>
          )}
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

      {/* Enhanced Deductions Summary */}
      {summary.deductions && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Deductions Breakdown</p>
          
          {/* Government Deductions */}
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Government Deductions</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">₱{summary.deductions.totals.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Philhealth:</span>
                <span className="font-medium">₱{summary.deductions.totals.philhealth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SSS:</span>
                <span className="font-medium">₱{summary.deductions.totals.sss.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pagibig:</span>
                <span className="font-medium">₱{summary.deductions.totals.pagibig.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Policy Deductions */}
          {(summary.deductions.totals.late > 0 || summary.deductions.totals.absence > 0) && (
            <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
              <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-1">Policy Deductions</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {summary.deductions.totals.late > 0 && (
                  <div className="flex justify-between">
                    <span>Late:</span>
                    <span className="font-medium">₱{summary.deductions.totals.late.toLocaleString()}</span>
                  </div>
                )}
                {summary.deductions.totals.absence > 0 && (
                  <div className="flex justify-between">
                    <span>Absence:</span>
                    <span className="font-medium">₱{summary.deductions.totals.absence.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Total Deductions */}
          <div className="flex justify-between pt-1 border-t">
            <span className="text-xs font-semibold">Total Deductions:</span>
            <span className="text-sm font-bold text-red-600">₱{summary.deductions.totals.total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Payroll Metrics */}
      {summary.metrics && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Attendance Metrics</p>
          <div className="grid grid-cols-1 gap-2">
            {/* Lateness */}
            {summary.metrics.lateness.totalLateInstances > 0 && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Lateness</span>
                  <span className="text-xs text-yellow-600 dark:text-yellow-300">
                    {summary.metrics.lateness.affectedEmployees} employees
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {summary.metrics.lateness.totalLateInstances} instances, {summary.metrics.lateness.totalLateMinutes} minutes total
                </div>
              </div>
            )}
            
            {/* Absences */}
            {summary.metrics.absence.totalAbsences > 0 && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-red-800 dark:text-red-200">Absences</span>
                  <span className="text-xs text-red-600 dark:text-red-300">
                    {summary.metrics.absence.affectedEmployees} employees
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {summary.metrics.absence.totalAbsences} total absent days
                </div>
              </div>
            )}
            
            {/* Undertime */}
            {summary.metrics.undertime.totalUndertimeMinutes > 0 && (
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Undertime</span>
                  <span className="text-xs text-orange-600 dark:text-orange-300">
                    {summary.metrics.undertime.affectedEmployees} employees
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {summary.metrics.undertime.totalUndertimeMinutes} minutes total
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payroll Period Status */}
      {summary.payrollStatus && (
        <div className="mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payroll Period Status</p>
          <div className={`p-2 rounded border ${
            summary.payrollStatus.currentStatus === 'COMPLETED' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            summary.payrollStatus.currentStatus === 'PROCESSING' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
            summary.payrollStatus.currentStatus === 'FAILED' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
            'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-medium ${
                summary.payrollStatus.currentStatus === 'COMPLETED' ? 'text-green-800 dark:text-green-200' :
                summary.payrollStatus.currentStatus === 'PROCESSING' ? 'text-blue-800 dark:text-blue-200' :
                summary.payrollStatus.currentStatus === 'FAILED' ? 'text-red-800 dark:text-red-200' :
                'text-gray-800 dark:text-gray-200'
              }`}>
                {summary.payrollStatus.currentStatus}
              </span>
              {summary.payrollStatus.lastGeneratedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(summary.payrollStatus.lastGeneratedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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
