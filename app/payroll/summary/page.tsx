'use client';

// React imports
import { useState, useEffect, useCallback } from 'react';

// UI component imports
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import PeriodSelection from '@/components/common/PeriodSelection';
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils';
import { FileText } from 'lucide-react';

// Layout and utility imports
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { useAuth } from '@/components/providers/auth-provider';

// Organization and filter components
import OrganizationFilter from '@/components/common/OrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';

// API service and types
import { payrollSummaryApiService, type PayrollRecord, type PayrollSummaryFilters, type PayrollStatusCounts } from '@/lib/service/payroll-summary-api.service';
import { PayrollResultPanel } from '@/components/payroll/PayrollResultPanel';

function PayrollSummaryContent() {
  // ============= STATE MANAGEMENT =============
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'DRAFT' | 'COMPUTED' | 'APPROVED' | 'RELEASED' | 'VOIDED'>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ============= HOOKS =============
  // Use the payroll periods hook
  const { periods: payrollPeriods } = usePayrollPeriods({
    lookbackPeriods: 2,
    lookaheadPeriods: 2,
    includeCurrentPeriod: true
  });

  const { user } = useAuth();

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
    enabled: true,
    showAllOption: true
  });

  // Additional state
  const [statusCounts, setStatusCounts] = useState<PayrollStatusCounts>({
    DRAFT: 0,
    COMPUTED: 0,
    APPROVED: 0,
    RELEASED: 0,
    VOIDED: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalPages: 1,
    totalRecords: 0,
  });
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    isActive: boolean;
    operation: 'approve' | 'release' | null;
    total: number;
    completed: number;
    failed: number;
    currentItem: string;
  }>({
    isActive: false,
    operation: null,
    total: 0,
    completed: 0,
    failed: 0,
    currentItem: '',
  });
  const [summaryStats, setSummaryStats] = useState({
    totalPayrolls: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
  });

  // ============= API FUNCTIONS =============
  const fetchPayrollSummary = async (filters: PayrollSummaryFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await payrollSummaryApiService.getPayrollSummary({
        organizationId: selectedOrganization || undefined,
        departmentId: selectedDepartment || undefined,
        periodStart: dateRange.start || undefined,
        periodEnd: dateRange.end || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        employeeId: selectedEmployee || undefined,
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      setPayrollData(response.payrolls);
      setSummaryStats({
        totalPayrolls: response.summary.totalPayrolls,
        totalGrossPay: response.summary.totalGrossPay,
        totalDeductions: response.summary.totalDeductions,
        totalNetPay: response.summary.totalNetPay,
      });
      setStatusCounts(response.summary.statusCounts);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch payroll summary:', error);
      // Fallback to empty state
      setPayrollData([]);
      setSummaryStats({
        totalPayrolls: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============= EVENT HANDLERS =============
  // Helper functions to track filter changes
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setDisabled(false); // Always re-enable button when filter changes
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setDisabled(false); // Always re-enable button when filter changes
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as any);
    setDisabled(false); // Always re-enable button when filter changes
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedEmployee(e.target.value);
    setDisabled(false); // Always re-enable button when filter changes
  };

  const handleOrganizationChangeWithTracking = (orgId: string) => {
    handleOrganizationChange(orgId);
    // Only reset disabled if filters have already been applied
    if (filtersApplied) {
      setDisabled(false);
    }
  };

  // Fetch departments based on selected organization
  const fetchDepartments = useCallback(async (organizationId: string | null) => {
    setIsLoadingDepartments(true);
    try {
      // Build URL - if no organizationId, fetch all departments
      let url = '/api/departments?limit=100';
      if (organizationId) {
        url += `&organizationId=${organizationId}`;
      }

      const response = await fetch(url, {
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

  // ============= EFFECTS =============
  // Fetch departments when organization changes
  useEffect(() => {
    fetchDepartments(selectedOrganization);
  }, [selectedOrganization, fetchDepartments]);

  // Update dateRange when selectedPeriod changes
  useEffect(() => {
    if (selectedPeriod) {
      // Find the selected period from payrollPeriods
      const period = payrollPeriods.find(p => p.value === selectedPeriod);
      if (period) {
        setDateRange({
          start: formatDateToYYYYMMDD(period.startDate),
          end: formatDateToYYYYMMDD(period.endDate)
        });
      }
    } else {
      setDateRange({ start: '', end: '' });
    }
  }, [selectedPeriod, payrollPeriods]);
  const fetchStatusCounts = async () => {
    try {
      const counts = await payrollSummaryApiService.getStatusCounts({
        organizationId: selectedOrganization || undefined,
        departmentId: selectedDepartment || undefined,
        periodStart: dateRange.start || undefined,
        periodEnd: dateRange.end || undefined,
      });
      setStatusCounts(counts);
    } catch (error) {
      console.error('Failed to fetch status counts:', error);
    }
  };

  const handleApprovePayroll = async (id: string) => {
    try {
      await payrollSummaryApiService.approvePayroll(id);
      await fetchPayrollSummary();
      await fetchStatusCounts();
    } catch (error) {
      console.error('Failed to approve payroll:', error);
      alert('Failed to approve payroll. Please try again.');
    }
  };

  const handleReleasePayroll = async (id: string) => {
    try {
      await payrollSummaryApiService.releasePayroll(id);
      await fetchPayrollSummary();
      await fetchStatusCounts();
    } catch (error) {
      console.error('Failed to release payroll:', error);
      alert('Failed to release payroll. Please try again.');
    }
  };

  const handleVoidPayroll = async (id: string, reason: string) => {
    try {
      await payrollSummaryApiService.voidPayroll(id, reason);
      await fetchPayrollSummary();
      await fetchStatusCounts();
    } catch (error) {
      console.error('Failed to void payroll:', error);
      alert('Failed to void payroll. Please try again.');
    }
  };

  useEffect(() => {
    // Only fetch data when filters have been applied
    if (!filtersApplied) {
      setIsLoading(false);
      return;
    }

    // Initialize with empty data if no organization is selected
    if (!selectedOrganization) {
      setIsLoading(false);
      setPayrollData([]);
      setSummaryStats({
        totalPayrolls: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
      });
      setStatusCounts({
        DRAFT: 0,
        COMPUTED: 0,
        APPROVED: 0,
        RELEASED: 0,
        VOIDED: 0,
      });
      return;
    }

    fetchPayrollSummary();
    fetchStatusCounts();
  }, [filtersApplied, refreshTrigger, pagination.page]);

  const handleExport = async () => {
    try {
      const response = await payrollSummaryApiService.exportPayrollSummary({
        organizationId: selectedOrganization || undefined,
        departmentId: selectedDepartment || undefined,
        periodStart: dateRange.start || undefined,
        periodEnd: dateRange.end || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        employeeId: selectedEmployee || undefined,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-summary-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export payroll summary:', error);
      alert('Failed to export payroll summary. Please try again.');
    }
  };

  const handleApplyFilters = () => {
    if (filtersApplied) {
      // If filters already applied, trigger refresh
      setRefreshTrigger(prev => prev + 1);
    } else {
      // First time applying filters
      setFiltersApplied(true);
    }
    setDisabled(true); // Disable button immediately
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setSelectedPeriod('');
    setSelectedDepartment('');
    setSelectedStatus('ALL');
    setSelectedEmployee('');
    setDateRange({ start: '', end: '' });
    setFiltersApplied(false);
    setDisabled(false); // Reset the state
    setRefreshTrigger(0); // Reset refresh trigger
    // Reset organization filter
    handleOrganizationChange('');
    setPayrollData([]);
    setSummaryStats({
      totalPayrolls: 0,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0,
    });
    setStatusCounts({
      DRAFT: 0,
      COMPUTED: 0,
      APPROVED: 0,
      RELEASED: 0,
      VOIDED: 0,
    });
  };

  const handleBulkApprove = async () => {
    const computedPayrolls = payrollData.filter(p => p.status === 'COMPUTED');
    if (computedPayrolls.length === 0) {
      alert('No computed payrolls to approve.');
      return;
    }

    setBulkOperationProgress({
      isActive: true,
      operation: 'approve',
      total: computedPayrolls.length,
      completed: 0,
      failed: 0,
      currentItem: '',
    });

    try {
      await payrollSummaryApiService.bulkApprovePayrolls(computedPayrolls.map(p => p.id));
      await fetchPayrollSummary();
      await fetchStatusCounts();
    } catch (error) {
      console.error('Failed to bulk approve payrolls:', error);
      alert('Failed to bulk approve payrolls. Please try again.');
    } finally {
      setBulkOperationProgress(prev => ({ ...prev, isActive: false }));
    }
  };

  const handleBulkRelease = async () => {
    const approvedPayrolls = payrollData.filter(p => p.status === 'APPROVED');
    if (approvedPayrolls.length === 0) {
      alert('No approved payrolls to release.');
      return;
    }

    setBulkOperationProgress({
      isActive: true,
      operation: 'release',
      total: approvedPayrolls.length,
      completed: 0,
      failed: 0,
      currentItem: '',
    });

    try {
      await payrollSummaryApiService.bulkReleasePayrolls(approvedPayrolls.map(p => p.id));
      await fetchPayrollSummary();
      await fetchStatusCounts();
    } catch (error) {
      console.error('Failed to bulk release payrolls:', error);
      alert('Failed to bulk release payrolls. Please try again.');
    } finally {
      setBulkOperationProgress(prev => ({ ...prev, isActive: false }));
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="max-w-7xl mx-auto px-4 py-8">
  //       <div className="animate-pulse">
  //         <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
  //         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
  //           <div className="h-24 bg-gray-200 rounded"></div>
  //           <div className="h-24 bg-gray-200 rounded"></div>
  //           <div className="h-24 bg-gray-200 rounded"></div>
  //           <div className="h-24 bg-gray-200 rounded"></div>
  //         </div>
  //         <div className="h-96 bg-gray-200 rounded"></div>
  //       </div>
  //     </div>
  //   );
  // }

  // Show message when filters haven't been applied
  if (!filtersApplied) {
    return (
      <TooltipProvider>
        <>
          <PageBreadcrumb pageTitle="Payroll Summary" />

          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Filters Panel */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        Clear
                      </Button>
                      <Button size="sm" onClick={handleApplyFilters} disabled={!selectedOrganization || !selectedPeriod || !selectedDepartment || disabled}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Organization Filter - Using reusable component */}
                    <RoleComponentWrapper roles={ADMINSTRATIVE_ROLES} showFallback={false}>
                      <OrganizationFilter
                        selectedOrganization={selectedOrganization}
                        organizationOptions={organizationOptions}
                        onOrganizationChange={handleOrganizationChange}
                        disabled={isOrganizationFilterLoading}
                        showAllOption={true}
                      />
                    </RoleComponentWrapper>

                    {/* Payroll Period Selection */}
                    <PeriodSelection
                      selectedCutoff={selectedPeriod}
                      onCutoffChange={handlePeriodChange}
                      payrollPeriods={payrollPeriods}
                    />

                    {/* Department Selection */}
                    <label htmlFor="department-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by Department
                    </label>
                    <Select
                      value={selectedDepartment}
                      onChange={handleDepartmentChange}
                      options={[
                        { value: '', label: 'Select department...' },
                        ...departments.map(dept => ({
                          value: dept.id,
                          label: dept.name
                        }))
                      ]}
                      placeholder="Select department"
                      disabled={isLoadingDepartments}
                    />

                    {/* Status Filter */}
                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by Status
                    </label>
                    <Select
                      value={selectedStatus}
                      onChange={handleStatusChange}
                      options={[
                        { value: 'ALL', label: 'All Statuses' },
                        { value: 'DRAFT', label: 'Draft' },
                        { value: 'COMPUTED', label: 'Computed' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'RELEASED', label: 'Released' },
                        { value: 'VOIDED', label: 'Voided' },
                      ]}
                      placeholder="Select Status"
                    />

                    {/* Employee Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employee Search</label>
                      <input
                        value={selectedEmployee}
                        onChange={handleEmployeeChange}
                        placeholder="Search by employee name or ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Panel */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Quick Stats</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Payrolls</p>
                    <p className="text-3xl font-bold mt-1">-</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gross Pay</span>
                      <span className="text-sm font-semibold">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Deductions</span>
                      <span className="text-sm font-semibold text-red-600">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Net Pay</span>
                      <span className="text-sm font-semibold text-green-600">-</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Status Overview</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Draft</p>
                        <p className="font-semibold">-</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-500">Computed</p>
                        <p className="font-semibold text-blue-600">-</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <p className="text-xs text-gray-500">Approved</p>
                        <p className="font-semibold text-yellow-600">-</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-xs text-gray-500">Released</p>
                        <p className="font-semibold text-green-600">-</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message to apply filters */}
            <Card className="mt-6">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payroll records found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {!selectedOrganization 
                    ? 'Select an organization to view payroll records.'
                    : 'Apply filters to search for payroll records.'
                  }
                </p>
                {selectedOrganization && (
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                    <Button size="sm" onClick={handleApplyFilters} disabled={!selectedOrganization || !selectedPeriod || !selectedDepartment || disabled}>
                      Apply Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      </TooltipProvider>
    );
  }

  // ============= RENDER =============
  return (
    <TooltipProvider>
      <>
        <PageBreadcrumb pageTitle="Payroll Summary" />

        <div className="max-w-7xl mx-aut py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={handleApplyFilters} disabled={!selectedOrganization || disabled}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Organization Filter - Using reusable component */}
                  <RoleComponentWrapper roles={ADMINSTRATIVE_ROLES} showFallback={false}>
                    <OrganizationFilter
                      selectedOrganization={selectedOrganization}
                      organizationOptions={organizationOptions}
                      onOrganizationChange={handleOrganizationChangeWithTracking}
                      disabled={isOrganizationFilterLoading}
                      showAllOption={true}
                    />
                  </RoleComponentWrapper>

                  {/* Payroll Period Selection */}
                  <PeriodSelection
                    selectedCutoff={selectedPeriod}
                    onCutoffChange={handlePeriodChange}
                    payrollPeriods={payrollPeriods}
                  />

                  {/* Department Selection */}
                  <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter by Department
                  </label>
                  <Select
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    options={[
                      { value: '', label: 'Select department...' },
                      ...departments.map(dept => ({
                        value: dept.id,
                        label: dept.name
                      }))
                    ]}
                    placeholder="Select department"
                    disabled={isLoadingDepartments}
                  />

                  {/* Status Filter */}
                  <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter by Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    options={[
                      { value: 'ALL', label: 'All Statuses' },
                      { value: 'DRAFT', label: 'Draft' },
                      { value: 'COMPUTED', label: 'Computed' },
                      { value: 'APPROVED', label: 'Approved' },
                      { value: 'RELEASED', label: 'Released' },
                      { value: 'VOIDED', label: 'Voided' },
                    ]}
                    placeholder="Select Status"
                  />

                  {/* Employee Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee Search</label>
                    <input
                      value={selectedEmployee}
                      onChange={handleEmployeeChange}
                      placeholder="Search by employee name or ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Panel */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Payrolls</p>
                  <p className="text-3xl font-bold mt-1">{summaryStats.totalPayrolls}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gross Pay</span>
                    <span className="text-sm font-semibold">₱ {summaryStats.totalGrossPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deductions</span>
                    <span className="text-sm font-semibold text-red-600">₱ {summaryStats.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Net Pay</span>
                    <span className="text-sm font-semibold text-green-600">₱ {summaryStats.totalNetPay.toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Status Overview</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Draft</p>
                      <p className="font-semibold">{statusCounts.DRAFT}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-500">Computed</p>
                      <p className="font-semibold text-blue-600">{statusCounts.COMPUTED}</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-gray-500">Approved</p>
                      <p className="font-semibold text-yellow-600">{statusCounts.APPROVED}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-500">Released</p>
                      <p className="font-semibold text-green-600">{statusCounts.RELEASED}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Results */}
          <PayrollResultPanel
            payrollData={payrollData}
            isLoading={isLoading}
            summaryStats={summaryStats}
            statusCounts={statusCounts}
            selectedOrganization={selectedOrganization}
            filtersApplied={filtersApplied}
            onApprovePayroll={handleApprovePayroll}
            onReleasePayroll={handleReleasePayroll}
            onVoidPayroll={handleVoidPayroll}
            onExport={handleExport}
            onBulkApprove={handleBulkApprove}
            onBulkRelease={handleBulkRelease}
            onClearFilters={handleClearFilters}
            onApplyFilters={() => setFiltersApplied(true)}
          />
        </div>
      </>
    </TooltipProvider>
  );
}

export default function PayrollSummaryPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PayrollSummaryContent />
    </ProtectedRoute>
  );
}
