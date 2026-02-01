'use client';

import { useState, useCallback, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import Select from '@/components/form/Select';
import Input from '@/components/form/input/InputField';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleAccess } from '@/components/providers/role-access-provider';

function PayrollRunContent() {
  const [selectedCutoff, setSelectedCutoff] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const { user } = useAuth();
  const { roles } = useRoleAccess();
  
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
  }, [selectedOrganization, isSuperAdmin, user?.organization_id, fetchDepartments]);

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

              {/* Cutoff Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Cutoff Period</label>
                <Select
                  value={selectedCutoff}
                  onChange={setSelectedCutoff}
                  placeholder="Select cutoff period..."
                  options={payrollPeriods.map(period => ({
                    value: period.value,
                    label: period.label
                  }))}
                />
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <Select
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  placeholder="Select department..."
                  options={departments.map(dept => ({
                    value: dept.id,
                    label: dept.name
                  }))}
                  disabled={!selectedOrganization && !user?.organization_id || isLoadingDepartments}
                />
                {(!selectedOrganization && !user?.organization_id) && (
                  <p className="mt-1 text-xs text-gray-500">Please select an organization first</p>
                )}
                {isLoadingDepartments && (
                  <p className="mt-1 text-xs text-gray-500">Loading departments...</p>
                )}
              </div>

              {/* Validation Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-sm mb-2">Validation Status</h3>
                <ul className="text-sm space-y-1">
                  <li>✓ Time entries: 125 records</li>
                  <li>✓ Attendance: Complete</li>
                  <li>✓ Overtime: 8 requests approved</li>
                  <li>⚠ Holidays: 2 employees on holiday</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleGeneratePayroll}
                  disabled={isGenerating || !selectedCutoff || !selectedDepartment}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Generate Payroll'}
                </Button>
                <Button variant="outline" className="flex-1">
                  Preview
                </Button>
              </div>
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
