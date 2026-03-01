'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PayrollSelectionPanel } from './components/PayrollSelectionPanel';
import { PayrollSummaryButton } from './components/PayrollSummaryButton';
import { PayrollSummaryResults } from './components/PayrollSummaryResults';
import { ActionButtons } from './components/ActionButtons';
import { MissingAttendanceModal } from './components/MissingAttendanceModal';
import { PayrollInformationPanel } from './components/PayrollInformationPanel';
import { ProtectedRoute } from '@/components/protected-route';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { useAuth } from '@/components/providers/auth-provider';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';

function PayrollRunContent() {
  console.log('PayrollRunContent render - new render');
  
  const router = useRouter();
  const [selectedCutoff, setSelectedCutoff] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  
  // Payroll summary state
  const [payrollSummary, setPayrollSummary] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Eligible employees state for payroll information panel
  const [eligibleEmployees, setEligibleEmployees] = useState<Array<{
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
  }>>([]);
  
  // Modal state
  const [isMissingAttendanceModalOpen, setIsMissingAttendanceModalOpen] = useState(false);
  
  // Track if payroll was just generated
  const [justGeneratedPayroll, setJustGeneratedPayroll] = useState(false);

  // Function to determine period status based on payroll summary
  const getPeriodStatus = (): 'DRAFT' | 'COMPUTED' | 'APPROVED' | 'RELEASED' | 'VOIDED' | undefined => {
    // If no cutoff selected, no status
    if (!selectedCutoff) return undefined;
    
    // If we just generated payroll, show as computed
    if (justGeneratedPayroll) return 'COMPUTED';
    
    // If no payroll summary, assume draft
    if (!payrollSummary) return 'DRAFT';
    
    const { payrollStatus } = payrollSummary;
    if (!payrollStatus) return 'DRAFT';
    
    // Check if we have the detailed counts (from ActionButtons usage)
    if (payrollStatus.generatedCount !== undefined || 
        payrollStatus.approvedCount !== undefined || 
        payrollStatus.releasedCount !== undefined) {
      
      const { generatedCount, approvedCount, releasedCount, voidedCount, totalCount } = payrollStatus;
      
      // If any are voided, show as voided (this is the most critical status)
      if (voidedCount > 0) return 'VOIDED';
      
      // If all are released, show as released
      if (releasedCount === totalCount && totalCount > 0) return 'RELEASED';
      
      // If all are approved, show as approved
      if (approvedCount === totalCount && totalCount > 0) return 'APPROVED';
      
      // If any are computed/generated, show as computed
      if (generatedCount > 0) return 'COMPUTED';
      
      // If no payrolls exist, it's draft
      return 'DRAFT';
    }
    // Otherwise use the currentStatus field
    else if (payrollStatus.currentStatus) {
      const { currentStatus, hasExistingRun } = payrollStatus;
      
      // Map the currentStatus to our period status
      switch (currentStatus) {
        case 'PENDING':
          return hasExistingRun ? 'COMPUTED' : 'DRAFT';
        case 'PROCESSING':
          return 'COMPUTED';
        case 'COMPLETED':
          return 'RELEASED';
        case 'FAILED':
          return 'VOIDED';
        default:
          return 'DRAFT';
      }
    }
    
    // Default to draft if we have a cutoff but no clear status
    return 'DRAFT';
  };

  // Log period status for debugging
  useEffect(() => {
    const status = getPeriodStatus();
    console.log('[PayrollRun] Period status:', status);
    console.log('[PayrollRun] Full payrollStatus data:', payrollSummary?.payrollStatus);
  }, [payrollSummary, selectedCutoff]);
  const [selectedEmployeeForAttendance, setSelectedEmployeeForAttendance] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  // Use the payroll periods hook with configurable period lookback/lookahead
  const { periods: payrollPeriods } = usePayrollPeriods({
    lookbackPeriods: 2, // Include 2 periods back
    lookaheadPeriods: 2, // Include 2 periods forward
    includeCurrentPeriod: true // Include current period
  });

  // Use the reusable organization filter hook
  const {
    selectedOrganization,
    organizationOptions,
    isOrganizationFilterLoading,
    handleOrganizationChange,
    isSuperAdmin,
    showAllOption,
  } = useOrganizationFilter({
    apiEndpoint: '/api/payroll',
    enabled: true, // Always enable organization filter for payroll
    showAllOption: false // Remove "All Organizations" option for payroll
  });

  // Fetch departments based on selected organization
  const fetchDepartments = useCallback(async (organizationId: string | null) => {
    if (!organizationId) {
      setDepartments([]);
      setSelectedDepartment('');
      return;
    }

    setIsLoadingDepartments(true);
    try {
      const response = await fetch(`/api/departments?organizationId=${organizationId}&limit=100`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setDepartments(result.data || []);
        // Reset department selection when organization changes
        setSelectedDepartment('');
      } else {
        console.error('Failed to fetch departments');
        setDepartments([]);
        setSelectedDepartment('');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
      setSelectedDepartment('');
    } finally {
      setIsLoadingDepartments(false);
    }
  }, []);

  // Fetch departments whenever organization changes
  useEffect(() => {
    const orgId = isSuperAdmin ? selectedOrganization : (user?.organizationId || null);
    fetchDepartments(orgId);
    // Reset payroll summary and generated flag when organization changes
    setPayrollSummary(null);
    setEligibleEmployees([]);
    setJustGeneratedPayroll(false);
  }, [selectedOrganization, isSuperAdmin, user?.organizationId, fetchDepartments]);

  // Reset payroll summary when cutoff changes
  useEffect(() => {
    setPayrollSummary(null);
    setEligibleEmployees([]);
    setJustGeneratedPayroll(false);
  }, [selectedDepartment]);

  // Listen for payroll summary generated event
  useEffect(() => {
    const handlePayrollSummaryGenerated = (event: any) => {
      if (event.detail.eligibleEmployees) {
        setEligibleEmployees(event.detail.eligibleEmployees);
      }
    };

    window.addEventListener('payrollSummaryGenerated', handlePayrollSummaryGenerated);
    
    return () => {
      window.removeEventListener('payrollSummaryGenerated', handlePayrollSummaryGenerated);
    };
  }, []);

  const handleGenerateSummary = async () => {
    if (!selectedCutoff) {
      alert('Please select a cutoff period');
      return;
    }

    const orgId = isSuperAdmin ? selectedOrganization : (user?.organizationId || null);
    if (!orgId) {
      alert('Please select an organization');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      console.log('Payroll Summary Debug:', {
        selectedCutoff,
        selectedOrganization,
        userOrganizationId: user?.organizationId
      });

      // Parse the selected cutoff to get start and end dates
      // Format: year-month-startDay-endDay (e.g., "2026-2-1-15")
      const cutoffParts = selectedCutoff.split('-');
      const year = parseInt(cutoffParts[0]);
      const month = parseInt(cutoffParts[1]) - 1; // JavaScript months are 0-based
      const startDay = parseInt(cutoffParts[2]);
      const endDay = parseInt(cutoffParts[3]);

      // Create dates in local timezone to avoid UTC conversion issues
      const periodStart = new Date(year, month, startDay, 0, 0, 0, 0);
      const periodEnd = new Date(year, month, endDay, 23, 59, 59, 999); // End of day

      // Format dates using local date components to avoid timezone conversion
      const formatLocalDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const response = await fetch('/api/payroll/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          organizationId: orgId,
          departmentId: selectedDepartment || undefined,
          cutoffPeriod: {
            start: formatLocalDate(periodStart),
            end: formatLocalDate(periodEnd),
          },
        }),
      });

      if (response.ok) {
        const summary = await response.json();
        console.log('Payroll Summary received:', summary);
        console.log('[PayrollRun] Before update - Current payrollStatus:', payrollSummary?.payrollStatus);
        console.log('[PayrollRun] New summary payrollStatus:', summary.payrollStatus);
        
        setPayrollSummary(summary);
        
        // Set eligible employees from summary response
        if (summary.employees && summary.employees.eligibleEmployees) {
          setEligibleEmployees(summary.employees.eligibleEmployees);
        }
        
        console.log('Payroll Summary state set');
      } else {
        const error = await response.json();
        alert(`Failed to generate summary: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating payroll summary:', error);
      alert('Failed to generate payroll summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleMissingAttendanceClick = () => {
    setIsMissingAttendanceModalOpen(true);
  };

  const handleViewEmployeeAttendance = (employeeId: string) => {
    // Open employee attendance page in new tab
    const attendanceUrl = `/employees/${employeeId}/attendance`;
    window.open(attendanceUrl, '_blank');
  };

  const handleGeneratePayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to generate payroll for all eligible employees?');
    if (!isConfirmed) return;

    setIsGenerating(true);

    try {
      const orgId = isSuperAdmin ? selectedOrganization : (user?.organizationId || null);

      // Parse cutoff period
      const [year, month, startDay, endDay] = selectedCutoff.split('-').map(Number);
      const periodStart = new Date(year, month - 1, startDay);
      const periodEnd = new Date(year, month - 1, endDay);

      // Generate payroll for each eligible employee using the new API
      const payrollPromises = eligibleEmployees.map(async (employee) => {
        const response = await fetch('/api/payroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'generate',
            employeeId: employee.id,
            organizationId: orgId,
            departmentId: selectedDepartment,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to generate payroll for ${employee.firstName} ${employee.lastName}: ${errorData.error || 'Unknown error'}`);
        }

        return response.json();
      });

      const results = await Promise.all(payrollPromises);
      console.log('Generated payrolls:', results);
      console.log('[PayrollRun] Generated payroll data structure:', results[0]); // Log first result structure
      
      // Mark that payroll was just generated
      setJustGeneratedPayroll(true);

      alert(`Successfully generated payroll for ${results.length} employees!\n\nPayrolls are now in COMPUTED status and ready for approval.`);

      // Refresh the summary to show updated status
      console.log('[PayrollRun] About to refresh summary after payroll generation');
      await handleGenerateSummary();

    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Error generating payroll. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGeneratePayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }
    
    const isConfirmed = window.confirm(`Are you sure you want to generate payroll for ${eligibleEmployees.length} eligible employees?`);
    if (!isConfirmed) return;
    
    // TODO: Implement actual batch generation
    console.log('Batch generating payroll for eligible employees:', eligibleEmployees);
    alert('Batch payroll generation initiated (demo - no actual action performed)');
  };

  const handleApprovePayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to approve payroll for all computed employees?');
    if (!isConfirmed) return;

    setIsGenerating(true);

    try {
      const orgId = isSuperAdmin ? selectedOrganization : (user?.organizationId || null);

      // Parse cutoff period
      const [year, month, startDay, endDay] = selectedCutoff.split('-').map(Number);
      const periodStart = new Date(year, month - 1, startDay);
      const periodEnd = new Date(year, month - 1, endDay);

      // Approve payroll for each eligible employee with COMPUTED status
      const approvalPromises = eligibleEmployees.map(async (employee) => {
        const response = await fetch('/api/payroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'approve',
            employeeId: employee.id,
            organizationId: orgId,
            departmentId: selectedDepartment,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to approve payroll for ${employee.firstName} ${employee.lastName}: ${errorData.error || 'Unknown error'}`);
        }

        return response.json();
      });

      const results = await Promise.all(approvalPromises);
      console.log('Approved payrolls:', results);

      alert(`Successfully approved payroll for ${results.length} employees!\n\nPayrolls are now in APPROVED status and ready for release.`);

      // Refresh the summary to show updated status
      await handleGenerateSummary();

    } catch (error) {
      console.error('Error approving payroll:', error);
      alert('Error approving payroll. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReleasePayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to release payroll for all approved employees?');
    if (!isConfirmed) return;

    setIsGenerating(true);

    try {
      const orgId = isSuperAdmin ? selectedOrganization : (user?.organizationId || null);

      // Parse cutoff period
      const [year, month, startDay, endDay] = selectedCutoff.split('-').map(Number);
      const periodStart = new Date(year, month - 1, startDay);
      const periodEnd = new Date(year, month - 1, endDay);

      // Release payroll for each eligible employee with APPROVED status
      const releasePromises = eligibleEmployees.map(async (employee) => {
        const response = await fetch('/api/payroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'release',
            employeeId: employee.id,
            organizationId: orgId,
            departmentId: selectedDepartment,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to release payroll for ${employee.firstName} ${employee.lastName}: ${errorData.error || 'Unknown error'}`);
        }

        return response.json();
      });

      const results = await Promise.all(releasePromises);
      console.log('Released payrolls:', results);

      alert(`Successfully released payroll for ${results.length} employees!\n\nPayrolls are now in RELEASED status and have been paid to employees.`);

      // Refresh the summary to show updated status
      await handleGenerateSummary();

    } catch (error) {
      console.error('Error releasing payroll:', error);
      alert('Error releasing payroll. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoidPayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }

    const reason = prompt('Please provide a reason for voiding the payroll:');
    if (!reason || !reason.trim()) {
      alert('Reason is required to void payroll');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to void payroll for all approved/released employees?');
    if (!isConfirmed) return;

    setIsGenerating(true);

    try {
      const orgId = isSuperAdmin ? selectedOrganization : (user?.organizationId || null);

      // Parse cutoff period
      const [year, month, startDay, endDay] = selectedCutoff.split('-').map(Number);
      const periodStart = new Date(year, month - 1, startDay);
      const periodEnd = new Date(year, month - 1, endDay);

      // Void payroll for each eligible employee with APPROVED/RELEASED status
      const voidPromises = eligibleEmployees.map(async (employee) => {
        const response = await fetch('/api/payroll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'void',
            employeeId: employee.id,
            organizationId: orgId,
            departmentId: selectedDepartment,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            reason: reason.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to void payroll for ${employee.firstName} ${employee.lastName}: ${errorData.error || 'Unknown error'}`);
        }

        return response.json();
      });

      const results = await Promise.all(voidPromises);
      console.log('Voided payrolls:', results);

      alert(`Successfully voided payroll for ${results.length} employees!\n\nReason: ${reason}`);

      // Refresh the summary to show updated status
      await handleGenerateSummary();

    } catch (error) {
      console.error('Error voiding payroll:', error);
      alert('Error voiding payroll. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    // Open employee payroll summary page in new tab
    // Remove department parameter from URL
    const url = `/payroll/summary/employee/${employeeId}?cutoff=${selectedCutoff}`;
    window.open(url, '_blank');
  };

  return (
    <TooltipProvider>
      <>
        <PageBreadcrumb pageTitle="Payroll Run" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selection Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold">Generate Payroll</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization Filter - Using reusable component */}
              <RoleComponentWrapper roles={ADMINSTRATIVE_ROLES} showFallback={false}>
                <OrganizationFilter
                  selectedOrganization={selectedOrganization}
                  organizationOptions={organizationOptions}
                  onOrganizationChange={handleOrganizationChange}
                  disabled={isOrganizationFilterLoading}
                  showAllOption={showAllOption}
                />
              </RoleComponentWrapper>

              {/* Payroll Selection Panel */}
              <PayrollSelectionPanel
                selectedCutoff={selectedCutoff}
                onCutoffChange={setSelectedCutoff}
                payrollPeriods={payrollPeriods.map(period => ({
                  value: period.value,
                  label: period.label
                }))}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
                departments={departments}
                isLoadingDepartments={isLoadingDepartments}
                userOrganizationId={user?.organizationId}
              />

              {/* Payroll Summary */}
              <div className="space-y-3">
                {/* Generate Summary Button - Always Visible */}
                <PayrollSummaryButton
                  onGenerateSummary={handleGenerateSummary}
                  isGenerating={isGeneratingSummary}
                  disabled={!selectedCutoff || (!selectedOrganization && !user?.organizationId)}
                />

                {/* Summary Results - Shown After Generation */}
                {payrollSummary && (
                  <PayrollSummaryResults summary={payrollSummary} onMissingAttendanceClick={handleMissingAttendanceClick} />
                )}
              </div>

              {/* Action Buttons */}
              <ActionButtons
                onGeneratePayroll={handleGeneratePayroll}
                onBatchGeneratePayroll={handleBatchGeneratePayroll}
                onApprovePayroll={handleApprovePayroll}
                onReleasePayroll={handleReleasePayroll}
                onVoidPayroll={handleVoidPayroll}
                isGenerating={isGenerating}
                disabled={!selectedCutoff}
                eligibleCount={eligibleEmployees.length}
                computedCount={payrollSummary?.payrollStatus?.generatedCount || 0}
                approvedCount={payrollSummary?.payrollStatus?.approvedCount || 0}
                releasedCount={payrollSummary?.payrollStatus?.releasedCount || 0}
              />
            </CardContent>
          </Card>

          {/* Info Panel */}
          <PayrollInformationPanel
            selectedCutoff={selectedCutoff}
            eligibleEmployeesCount={eligibleEmployees.length}
            canGenerate={payrollSummary?.readiness?.canGenerate || false}
            lastGeneratedAt={payrollSummary?.payrollStatus?.lastGeneratedAt}
            eligibleEmployees={eligibleEmployees}
            onEmployeeClick={handleEmployeeClick}
            periodStatus={getPeriodStatus()}
          />
        </div>
      </div>

      {/* Missing Attendance Modal */}
      <MissingAttendanceModal
        isOpen={isMissingAttendanceModalOpen}
        onClose={() => setIsMissingAttendanceModalOpen(false)}
        organizationId={isSuperAdmin ? selectedOrganization : (user?.organizationId || null)}
        departmentId={selectedDepartment || undefined}
        cutoffPeriod={payrollSummary ? {
          start: payrollSummary.cutoffPeriod.start,
          end: payrollSummary.cutoffPeriod.end,
        } : null}
        onViewAttendance={handleViewEmployeeAttendance}
      />
      </>
    </TooltipProvider>
  );
}

export default function PayrollRunPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PayrollRunContent />
    </ProtectedRoute>
  );
}
