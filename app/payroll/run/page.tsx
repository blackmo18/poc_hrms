'use client';

import { useState, useEffect, useCallback } from 'react';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { PayrollSelectionPanel } from './components/PayrollSelectionPanel';
import { PayrollSummaryButton } from './components/PayrollSummaryButton';
import { PayrollSummaryResults } from './components/PayrollSummaryResults';
import { ActionButtons } from './components/ActionButtons';
import { ProtectedRoute } from '@/components/protected-route';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { useAuth } from '@/components/providers/auth-provider';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';

function PayrollRunContent() {
  const [selectedCutoff, setSelectedCutoff] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  
  // Payroll summary state
  const [payrollSummary, setPayrollSummary] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
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
    const orgId = isSuperAdmin ? selectedOrganization : (user?.organization_id || null);
    fetchDepartments(orgId);
    // Reset payroll summary when organization changes
    setPayrollSummary(null);
  }, [selectedOrganization, isSuperAdmin, user?.organization_id, fetchDepartments]);

  // Reset payroll summary when department changes
  useEffect(() => {
    setPayrollSummary(null);
  }, [selectedDepartment]);

  const handleGenerateSummary = async () => {
    if (!selectedCutoff) {
      alert('Please select a cutoff period');
      return;
    }

    const orgId = isSuperAdmin ? selectedOrganization : (user?.organization_id || null);
    if (!orgId) {
      alert('Please select an organization');
      return;
    }

    setIsGeneratingSummary(true);
    try {
      console.log('Payroll Summary Debug:', {
        selectedCutoff,
        selectedOrganization,
        userOrganizationId: user?.organization_id
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
        setPayrollSummary(summary);
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

  const handleGeneratePayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }
    setIsGenerating(true);
    // TODO: Call API to generate payroll with organization filter
    const orgId = isSuperAdmin ? selectedOrganization : (user?.organization_id || null);
    console.log('Generating payroll for:', { selectedCutoff, selectedDepartment, organizationId: orgId });
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
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
                selectedOrganization={selectedOrganization}
                organizationOptions={organizationOptions}
                onOrganizationChange={handleOrganizationChange}
                isOrganizationFilterLoading={isOrganizationFilterLoading}
                showAllOption={showAllOption}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
                departments={departments}
                isLoadingDepartments={isLoadingDepartments}
                userOrganizationId={user?.organization_id}
              />

              {/* Payroll Summary */}
              <div className="space-y-3">
                {/* Generate Summary Button - Always Visible */}
                <PayrollSummaryButton
                  onGenerateSummary={handleGenerateSummary}
                  isGenerating={isGeneratingSummary}
                  disabled={!selectedCutoff || (!selectedOrganization && !user?.organization_id)}
                />

                {/* Summary Results - Shown After Generation */}
                {payrollSummary && (
                  <PayrollSummaryResults summary={payrollSummary} />
                )}
              </div>

              {/* Action Buttons */}
              <ActionButtons
                onGeneratePayroll={handleGeneratePayroll}
                isGenerating={isGenerating}
                disabled={!selectedCutoff || !selectedDepartment}
              />
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Payroll Information</h3>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Current Period</p>
                <p className="font-medium">Jan 16 - 31, 2024</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Employees</p>
                <p className="font-medium">45 in selected department</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-medium text-yellow-600">Pending Generation</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Last generated: Jan 15, 2024</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function PayrollRunPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PayrollRunContent />
    </ProtectedRoute>
  );
}
