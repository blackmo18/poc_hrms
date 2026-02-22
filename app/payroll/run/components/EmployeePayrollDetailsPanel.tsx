'use client';

import { useState, useEffect } from 'react';
import { X, Download, Eye } from 'lucide-react';

interface PayrollEarning {
  id: string;
  type: string;
  hours: number;
  rate: number;
  amount: number;
}

interface PayrollDeduction {
  id: string;
  type: string;
  amount: number;
}

interface EmployeePayrollDetails {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName?: string;
  jobTitleName?: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  status: string;
  processedAt?: string;
  earnings?: PayrollEarning[];
  deductions?: PayrollDeduction[];
  taxDeduction?: number;
  sssDeduction?: number;
  philhealthDeduction?: number;
  pagibigDeduction?: number;
  lateDeduction?: number;
  absenceDeduction?: number;
  baseSalary?: number;
}

interface EmployeePayrollDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeePayrollDetails | null;
  onViewPayslip?: (employeeId: string) => void;
  onDownloadPayslip?: (employeeId: string) => void;
}

export function EmployeePayrollDetailsPanel({
  isOpen,
  onClose,
  employee,
  onViewPayslip,
  onDownloadPayslip,
}: EmployeePayrollDetailsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [payrollDetails, setPayrollDetails] = useState<EmployeePayrollDetails | null>(null);

  useEffect(() => {
    if (employee && isOpen) {
      setPayrollDetails(employee);
    }
  }, [employee, isOpen]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'COMPUTED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-indigo-100 text-indigo-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'VOIDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₱0.00';
    }
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const calculateTotalEarnings = () => {
    if (!payrollDetails) return 0;
    
    // If we have earnings array from processed payroll, use it
    if (payrollDetails.earnings && payrollDetails.earnings.length > 0) {
      return payrollDetails.earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
    }
    
    // If payroll has been processed, use the grossPay from payroll record
    if (typeof payrollDetails.grossPay === 'number' && payrollDetails.grossPay > 0) {
      return payrollDetails.grossPay;
    }
    
    // Otherwise, no payroll has been processed yet
    return 0;
  };

  const calculateTotalDeductions = () => {
    if (!payrollDetails) return 0;
    let total = 0;
    
    // Sum from deductions array if available
    if (payrollDetails.deductions && payrollDetails.deductions.length > 0) {
      total += payrollDetails.deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
    }
    
    // Add individual deduction fields
    const taxDeduction = typeof payrollDetails.taxDeduction === 'number' ? payrollDetails.taxDeduction : 0;
    const sssDeduction = typeof payrollDetails.sssDeduction === 'number' ? payrollDetails.sssDeduction : 0;
    const philhealthDeduction = typeof payrollDetails.philhealthDeduction === 'number' ? payrollDetails.philhealthDeduction : 0;
    const pagibigDeduction = typeof payrollDetails.pagibigDeduction === 'number' ? payrollDetails.pagibigDeduction : 0;
    const lateDeduction = typeof payrollDetails.lateDeduction === 'number' ? payrollDetails.lateDeduction : 0;
    const absenceDeduction = typeof payrollDetails.absenceDeduction === 'number' ? payrollDetails.absenceDeduction : 0;
    
    total += taxDeduction + sssDeduction + philhealthDeduction + pagibigDeduction + lateDeduction + absenceDeduction;
    
    return total;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payroll Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      ) : payrollDetails ? (
        <div className="p-4 space-y-6">
          {/* Employee Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Employee Information</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm font-medium">
                  {payrollDetails.firstName} {payrollDetails.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm">{payrollDetails.email}</p>
              </div>
              {payrollDetails.departmentName && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-sm">{payrollDetails.departmentName}</p>
                </div>
              )}
              {payrollDetails.jobTitleName && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Position</p>
                  <p className="text-sm">{payrollDetails.jobTitleName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payroll Period */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Payroll Period</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Period</p>
                <p className="text-sm">
                  {new Date(payrollDetails.periodStart).toLocaleDateString()} - {' '}
                  {new Date(payrollDetails.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payrollDetails.status)}`}>
                  {payrollDetails.status}
                </span>
              </div>
              {payrollDetails.processedAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Processed At</p>
                  <p className="text-sm">{new Date(payrollDetails.processedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Earnings</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              {payrollDetails.earnings && payrollDetails.earnings.length > 0 ? (
                payrollDetails.earnings.map((earning) => (
                  <div key={earning.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium capitalize">{earning.type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {earning.hours} hrs × {formatCurrency(earning.rate)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(earning.amount)}</p>
                  </div>
                ))
              ) : (
                <>
                  {typeof payrollDetails.grossPay === 'number' && payrollDetails.grossPay > 0 ? (
                    <div className="flex justify-between items-center">
                      <p className="text-sm">Total Earnings</p>
                      <p className="text-sm font-medium">{formatCurrency(payrollDetails.grossPay)}</p>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">No payroll processed</p>
                      <p className="text-sm font-medium text-gray-500">₱0.00</p>
                    </div>
                  )}
                </>
              )}
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">Gross Pay</p>
                  <p className="text-sm font-bold">{formatCurrency(calculateTotalEarnings())}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Deductions</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              {/* Government Deductions */}
              {payrollDetails.taxDeduction && (
                <div className="flex justify-between items-center">
                  <p className="text-sm">Tax</p>
                  <p className="text-sm">{formatCurrency(payrollDetails.taxDeduction)}</p>
                </div>
              )}
              {payrollDetails.sssDeduction && (
                <div className="flex justify-between items-center">
                  <p className="text-sm">SSS</p>
                  <p className="text-sm">{formatCurrency(payrollDetails.sssDeduction)}</p>
                </div>
              )}
              {payrollDetails.philhealthDeduction && (
                <div className="flex justify-between items-center">
                  <p className="text-sm">Philhealth</p>
                  <p className="text-sm">{formatCurrency(payrollDetails.philhealthDeduction)}</p>
                </div>
              )}
              {payrollDetails.pagibigDeduction && (
                <div className="flex justify-between items-center">
                  <p className="text-sm">Pagibig</p>
                  <p className="text-sm">{formatCurrency(payrollDetails.pagibigDeduction)}</p>
                </div>
              )}
              
              {/* Policy Deductions */}
              {payrollDetails.lateDeduction && (
                <div className="flex justify-between items-center">
                  <p className="text-sm">Late Deduction</p>
                  <p className="text-sm text-red-600">{formatCurrency(payrollDetails.lateDeduction)}</p>
                </div>
              )}
              {payrollDetails.absenceDeduction && (
                <div className="flex justify-between items-center">
                  <p className="text-sm">Absence Deduction</p>
                  <p className="text-sm text-red-600">{formatCurrency(payrollDetails.absenceDeduction)}</p>
                </div>
              )}

              {/* Other Deductions */}
              {payrollDetails.deductions && payrollDetails.deductions.map((deduction) => (
                <div key={deduction.id} className="flex justify-between items-center">
                  <p className="text-sm capitalize">{deduction.type.replace('_', ' ')}</p>
                  <p className="text-sm">{formatCurrency(deduction.amount)}</p>
                </div>
              ))}

              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold">Total Deductions</p>
                  <p className="text-sm font-bold text-red-600">{formatCurrency(calculateTotalDeductions())}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-green-800 dark:text-green-200">Net Pay</p>
              <p className="text-xl font-bold text-green-800 dark:text-green-200">
                {typeof payrollDetails?.netPay === 'number' && payrollDetails.netPay > 0 
                  ? formatCurrency(payrollDetails.netPay)
                  : calculateTotalEarnings() > 0 
                    ? formatCurrency(calculateTotalEarnings() - calculateTotalDeductions())
                    : '₱0.00'
                }
              </p>
            </div>
            {typeof payrollDetails?.netPay !== 'number' && calculateTotalEarnings() === 0 && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Generate payroll to see net pay
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onViewPayslip && (
              <button
                onClick={() => onViewPayslip(payrollDetails.employeeId)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Payslip
              </button>
            )}
            {onDownloadPayslip && (
              <button
                onClick={() => onDownloadPayslip(payrollDetails.employeeId)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No payroll details available
        </div>
      )}
    </div>
  );
}
