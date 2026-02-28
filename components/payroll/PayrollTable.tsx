import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { PayrollRecord } from '@/lib/service/payroll-summary-api.service';

interface PayrollTableProps {
  payrollData: PayrollRecord[];
  isLoading: boolean;
  onApprovePayroll: (id: string) => void;
  onReleasePayroll: (id: string) => void;
  onVoidPayroll: (id: string, reason: string) => void;
  onExport: () => void;
  onBulkApprove: () => void;
  onBulkRelease: () => void;
  selectedOrganization: string | null;
  filtersApplied: boolean;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  onApproveClick: (id: string, employeeName: string, employeeId: string, department: string) => void;
  onReleaseClick: (id: string, employeeName: string, employeeId: string, department: string) => void;
  onVoidClick: (id: string, employeeName: string, employeeId: string, department: string) => void;
}

export function PayrollTable({
  payrollData,
  isLoading,
  onApprovePayroll,
  onReleasePayroll,
  onVoidPayroll,
  onExport,
  onBulkApprove,
  onBulkRelease,
  selectedOrganization,
  filtersApplied,
  onClearFilters,
  onApplyFilters,
  onApproveClick,
  onReleaseClick,
  onVoidClick,
}: PayrollTableProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Payroll Details</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>Export</Button>
            <Button size="sm" variant="outline" onClick={onBulkApprove}>Approve All</Button>
            <Button size="sm" onClick={onBulkRelease}>Release All</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto w-full">
          <Table className="w-full text-sm min-w-max">
            <TableHeader>
              <TableRow className="border-b">
                <TableCell isHeader className="text-left py-2 px-4 min-w-[150px]">Name</TableCell>
                <TableCell isHeader className="text-left py-2 px-4 min-w-[100px]">ID</TableCell>
                <TableCell isHeader className="text-left py-2 px-4 min-w-[150px]">Department</TableCell>
                <TableCell isHeader className="text-center py-2 px-4 min-w-[100px]">Status</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 min-w-[120px]">Gross Pay</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs text-blue-600 min-w-[80px]">Tax</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs text-blue-600 min-w-[80px]">Phil</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs text-blue-600 min-w-[80px]">SSS</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs text-blue-600 min-w-[80px]">PAG</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs text-orange-600 min-w-[80px]">Late</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs text-orange-600 min-w-[80px]">Abs</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 text-xs font-semibold min-w-[100px]">Total</TableCell>
                <TableCell isHeader className="text-right py-2 px-4 min-w-[120px]">Net Pay</TableCell>
                <TableCell isHeader className="text-center py-2 px-4 min-w-[150px]">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((payroll) => {
                const grossPay = payroll.grossPay;
                const totalDeductions = payroll.totalDeductions;
                return (
                  <TableRow key={payroll.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell className="py-3 px-4">
                      <p className="font-medium">{payroll.employee.firstName} {payroll.employee.lastName}</p>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <p className="text-sm text-gray-600">{payroll.employee.employeeId}</p>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <p className="text-sm">{payroll.employee.department?.name || 'No Department'}</p>
                    </TableCell>
                    <TableCell className="text-center py-3 px-4">
                      <Badge>
                        {payroll.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3 px-4">₱ {payroll.grossPay.toLocaleString()}</TableCell>
                    <TableCell className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                      {payroll.deductions.find(d => d.type === 'TAX') ? `₱ ${payroll.deductions.find(d => d.type === 'TAX')!.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                      {payroll.deductions.find(d => d.type === 'PHILHEALTH') ? `₱ ${payroll.deductions.find(d => d.type === 'PHILHEALTH')!.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                      {payroll.deductions.find(d => d.type === 'SSS') ? `₱ ${payroll.deductions.find(d => d.type === 'SSS')!.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                      {payroll.deductions.find(d => d.type === 'PAGIBIG') ? `₱ ${payroll.deductions.find(d => d.type === 'PAGIBIG')!.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                      {payroll.deductions.find(d => d.type === 'LATE') ? `₱ ${payroll.deductions.find(d => d.type === 'LATE')!.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                      {payroll.deductions.find(d => d.type === 'ABSENCE') ? `₱ ${payroll.deductions.find(d => d.type === 'ABSENCE')!.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4 font-semibold">₱ {totalDeductions.toLocaleString()}</TableCell>
                    <TableCell className="text-right py-3 px-4 font-medium text-green-600">₱ {payroll.netPay.toLocaleString()}</TableCell>
                    <TableCell className="text-center py-3 px-4">
                      <div className="flex gap-1 justify-center">
                        {payroll.status === 'COMPUTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2"
                            onClick={() => onApproveClick(payroll.id, `${payroll.employee.firstName} ${payroll.employee.lastName}`, payroll.employee.employeeId, payroll.employee.department?.name || 'N/A')}
                          >
                            Approve
                          </Button>
                        )}
                        {payroll.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2"
                            onClick={() => onReleaseClick(payroll.id, `${payroll.employee.firstName} ${payroll.employee.lastName}`, payroll.employee.employeeId, payroll.employee.department?.name || 'N/A')}
                          >
                            Release
                          </Button>
                        )}
                        {(payroll.status === 'DRAFT' || payroll.status === 'COMPUTED' || payroll.status === 'APPROVED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 text-red-600"
                            onClick={() => onVoidClick(payroll.id, `${payroll.employee.firstName} ${payroll.employee.lastName}`, payroll.employee.employeeId, payroll.employee.department?.name || 'N/A')}
                          >
                            Void
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {!isLoading && payrollData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payroll records found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {!selectedOrganization 
                ? 'Select an organization to view payroll records.'
                : !filtersApplied 
                ? 'Apply filters to search for payroll records.'
                : 'No payroll records found for the selected period and filters.'
              }
            </p>
            {selectedOrganization && !filtersApplied && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={onClearFilters}>
                  Clear Filters
                </Button>
                <Button size="sm" onClick={onApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            )}
            {selectedOrganization && filtersApplied && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={onClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
