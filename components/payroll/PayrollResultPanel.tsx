import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { PayrollTable } from './PayrollTable';
import { ApproveModal } from './ApproveModal';
import { ReleaseModal } from './ReleaseModal';
import { VoidModal } from './VoidModal';
import { ErrorModal } from './ErrorModal';
import { PayrollRecord } from '@/lib/service/payroll-summary-api.service';

interface SummaryStats {
  totalPayrolls: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}

interface StatusCounts {
  DRAFT: number;
  COMPUTED: number;
  APPROVED: number;
  RELEASED: number;
  VOIDED: number;
}

interface PayrollResultPanelProps {
  payrollData: PayrollRecord[];
  isLoading: boolean;
  summaryStats: SummaryStats;
  statusCounts: StatusCounts;
  selectedOrganization: string | null;
  filtersApplied: boolean;
  onApprovePayroll: (id: string) => void;
  onReleasePayroll: (id: string) => void;
  onVoidPayroll: (id: string, reason: string) => void;
  onExport: () => void;
  onBulkApprove: () => void;
  onBulkRelease: () => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export function PayrollResultPanel({
  payrollData,
  isLoading,
  summaryStats,
  statusCounts,
  selectedOrganization,
  filtersApplied,
  onApprovePayroll,
  onReleasePayroll,
  onVoidPayroll,
  onExport,
  onBulkApprove,
  onBulkRelease,
  onClearFilters,
  onApplyFilters,
}: PayrollResultPanelProps) {
  const [approveModal, setApproveModal] = useState<{ isOpen: boolean; payrollId: string; employeeName: string; employeeId: string; department: string }>({
    isOpen: false,
    payrollId: '',
    employeeName: '',
    employeeId: '',
    department: '',
  });
  
  const [releaseModal, setReleaseModal] = useState<{ isOpen: boolean; payrollId: string; employeeName: string; employeeId: string; department: string }>({
    isOpen: false,
    payrollId: '',
    employeeName: '',
    employeeId: '',
    department: '',
  });
  
  const [voidModal, setVoidModal] = useState<{ isOpen: boolean; payrollId: string; employeeName: string; employeeId: string; department: string }>({
    isOpen: false,
    payrollId: '',
    employeeName: '',
    employeeId: '',
    department: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: 'Error',
    message: '',
    details: '',
  });

  const handleApproveClick = (payrollId: string, employeeName: string, employeeId: string, department: string) => {
    setApproveModal({
      isOpen: true,
      payrollId,
      employeeName,
      employeeId,
      department,
    });
  };

  const handleReleaseClick = (payrollId: string, employeeName: string, employeeId: string, department: string) => {
    setReleaseModal({
      isOpen: true,
      payrollId,
      employeeName,
      employeeId,
      department,
    });
  };

  const handleVoidClick = (payrollId: string, employeeName: string, employeeId: string, department: string) => {
    setVoidModal({
      isOpen: true,
      payrollId,
      employeeName,
      employeeId,
      department,
    });
  };

  const handleApproveConfirm = async () => {
    setIsProcessing(true);
    try {
      await onApprovePayroll(approveModal.payrollId);
      setApproveModal({ isOpen: false, payrollId: '', employeeName: '', employeeId: '', department: '' });
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Approval Failed',
        message: 'Failed to approve payroll. Please try again.',
        details: error?.message || 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseConfirm = async () => {
    setIsProcessing(true);
    try {
      await onReleasePayroll(releaseModal.payrollId);
      setReleaseModal({ isOpen: false, payrollId: '', employeeName: '', employeeId: '', department: '' });
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Release Failed',
        message: 'Failed to release payroll. Please try again.',
        details: error?.message || 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoidConfirm = async (reason: string) => {
    setIsProcessing(true);
    try {
      await onVoidPayroll(voidModal.payrollId, reason);
      setVoidModal({ isOpen: false, payrollId: '', employeeName: '', employeeId: '', department: '' });
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: 'Void Failed',
        message: 'Failed to void payroll. Please try again.',
        details: error?.message || 'Unknown error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div>
      {/* <div>
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExport}
                className="w-full justify-start"
                disabled={payrollData.length === 0}
              >
                Export Data
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onBulkApprove}
                className="w-full justify-start"
                disabled={payrollData.filter(p => p.status === 'COMPUTED').length === 0}
              >
                Approve All ({payrollData.filter(p => p.status === 'COMPUTED').length})
              </Button>
              <Button 
                size="sm" 
                onClick={onBulkRelease}
                className="w-full justify-start"
                disabled={payrollData.filter(p => p.status === 'APPROVED').length === 0}
              >
                Release All ({payrollData.filter(p => p.status === 'APPROVED').length})
              </Button>
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 mb-2">
                  {payrollData.length} payroll records found
                </p>
                {filtersApplied && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClearFilters}
                    className="w-full justify-start text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Payroll Table */}
      <PayrollTable
        payrollData={payrollData}
        isLoading={isLoading}
        onApprovePayroll={onApprovePayroll}
        onReleasePayroll={onReleasePayroll}
        onVoidPayroll={onVoidPayroll}
        onExport={onExport}
        onBulkApprove={onBulkApprove}
        onBulkRelease={onBulkRelease}
        selectedOrganization={selectedOrganization}
        filtersApplied={filtersApplied}
        onClearFilters={onClearFilters}
        onApplyFilters={onApplyFilters}
        onApproveClick={handleApproveClick}
        onReleaseClick={handleReleaseClick}
        onVoidClick={handleVoidClick}
      />

      {/* Confirmation Modals */}
      <ApproveModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, payrollId: '', employeeName: '', employeeId: '', department: '' })}
        onConfirm={handleApproveConfirm}
        employeeName={approveModal.employeeName}
        employeeId={approveModal.employeeId}
        department={approveModal.department}
        isLoading={isProcessing}
      />

      <ReleaseModal
        isOpen={releaseModal.isOpen}
        onClose={() => setReleaseModal({ isOpen: false, payrollId: '', employeeName: '', employeeId: '', department: '' })}
        onConfirm={handleReleaseConfirm}
        employeeName={releaseModal.employeeName}
        employeeId={releaseModal.employeeId}
        department={releaseModal.department}
        isLoading={isProcessing}
      />

      <VoidModal
        isOpen={voidModal.isOpen}
        onClose={() => setVoidModal({ isOpen: false, payrollId: '', employeeName: '', employeeId: '', department: '' })}
        onConfirm={handleVoidConfirm}
        employeeName={voidModal.employeeName}
        employeeId={voidModal.employeeId}
        department={voidModal.department}
        isLoading={isProcessing}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: 'Error', message: '', details: '' })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />
    </div>
  );
}
