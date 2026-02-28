'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircleIcon, XCircleIcon, FilterIcon } from 'lucide-react';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { payrollSummaryApiService, type PayrollRecord, type PayrollSummaryResponse, type PayrollSummaryFilters, type PayrollStatusCounts } from '@/lib/service/payroll-summary-api.service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';
import Button from '@/components/ui/button/Button';
import PeriodSelection from '@/components/common/PeriodSelection';
import { formatDateToYYYYMMDD } from '@/lib/utils/date-utils';

function PayrollSummaryContent() {
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
  
  // Use the payroll periods hook
  const { periods: payrollPeriods } = usePayrollPeriods({
    lookbackPeriods: 2,
    lookaheadPeriods: 2,
    includeCurrentPeriod: true
  });
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
    showAllOption: false
  });

  // Fetch payroll summary data
  const fetchPayrollSummary = async (filters: PayrollSummaryFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await payrollSummaryApiService.getPayrollSummary({
        organizationId: selectedOrganization || undefined,
        departmentId: selectedDepartment || undefined,
        periodStart: dateRange.start || undefined,
        periodEnd: dateRange.end || undefined,
        status: selectedStatus,
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
  }, [filtersApplied, selectedOrganization, selectedDepartment, dateRange, selectedStatus, selectedEmployee, selectedPeriod, pagination.page]);

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
    setFiltersApplied(true);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setSelectedPeriod('');
    setSelectedDepartment('');
    setSelectedStatus('ALL');
    setSelectedEmployee('');
    setDateRange({ start: '', end: '' });
    setFiltersApplied(false);
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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
                      <Button size="sm" onClick={handleApplyFilters} disabled={!selectedOrganization}>
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
                        showAllOption={showAllOption}
                      />
                    </RoleComponentWrapper>

                    {/* Payroll Period Selection */}
                    <PeriodSelection
                      selectedCutoff={selectedPeriod}
                      onCutoffChange={setSelectedPeriod}
                      payrollPeriods={payrollPeriods}
                    />

                    {/* Department Selection */}
                    <Select
                      value={selectedDepartment}
                      onChange={(value: any) => setSelectedDepartment(value)}
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
                    <Select
                      value={selectedStatus}
                      onChange={(value: any) => setSelectedStatus(value)}
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
                        onChange={(e) => setSelectedEmployee(e.target.value)}
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
                <p className="text-gray-500 text-lg">Please select filters and click "Apply Filters" to view payroll data</p>
              </CardContent>
            </Card>
          </div>
        </>
      </TooltipProvider>
    );
  }

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
                  <Button size="sm" onClick={handleApplyFilters} disabled={!selectedOrganization}>
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
                    showAllOption={showAllOption}
                  />
                </RoleComponentWrapper>

                {/* Payroll Period Selection */}
                <PeriodSelection
                  selectedCutoff={selectedPeriod}
                  onCutoffChange={setSelectedPeriod}
                  payrollPeriods={payrollPeriods}
                />

                {/* Department Selection */}
                <Select
                  value={selectedDepartment}
                  onChange={(value: any) => setSelectedDepartment(value)}
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
                <Select
                  value={selectedStatus}
                  onChange={(value: any) => setSelectedStatus(value)}
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
                    onChange={(e) => setSelectedEmployee(e.target.value)}
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

        {/* Enhanced Payroll Table */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Payroll Details</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>Export</Button>
                <Button size="sm" variant="outline" onClick={handleBulkApprove}>Approve All</Button>
                <Button size="sm" onClick={handleBulkRelease}>Release All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Employee</th>
                    <th className="text-right py-2 px-4">Gross Pay</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">Tax</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">Phil</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">SSS</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">PAG</th>
                    <th className="text-right py-2 px-4 text-xs text-orange-600">Late</th>
                    <th className="text-right py-2 px-4 text-xs text-orange-600">Abs</th>
                    <th className="text-right py-2 px-4 text-xs font-semibold">Total</th>
                    <th className="text-right py-2 px-4">Net Pay</th>
                    <th className="text-center py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((payroll) => {
                    const grossPay = payroll.grossPay;
                    const totalDeductions = payroll.totalDeductions;
                    return (
                      <tr key={payroll.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{payroll.employee.firstName} {payroll.employee.lastName}</p>
                            <p className="text-xs text-gray-500">{payroll.employee.employeeId} • {payroll.employee.departmentName}</p>
                            <div className="mt-1">
                              <Badge>
                                {payroll.status}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">₱ {payroll.grossPay.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                          {payroll.deductions.find(d => d.type === 'TAX') ? `₱ ${payroll.deductions.find(d => d.type === 'TAX')!.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                          {payroll.deductions.find(d => d.type === 'PHILHEALTH') ? `₱ ${payroll.deductions.find(d => d.type === 'PHILHEALTH')!.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                          {payroll.deductions.find(d => d.type === 'SSS') ? `₱ ${payroll.deductions.find(d => d.type === 'SSS')!.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">
                          {payroll.deductions.find(d => d.type === 'PAGIBIG') ? `₱ ${payroll.deductions.find(d => d.type === 'PAGIBIG')!.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                          {payroll.deductions.find(d => d.type === 'LATE') ? `₱ ${payroll.deductions.find(d => d.type === 'LATE')!.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                          {payroll.deductions.find(d => d.type === 'ABSENCE') ? `₱ ${payroll.deductions.find(d => d.type === 'ABSENCE')!.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold">₱ {totalDeductions.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-medium text-green-600">₱ {payroll.netPay.toLocaleString()}</td>
                        <td className="text-center py-3 px-4">
                          <div className="flex gap-1 justify-center">
                            {payroll.status === 'COMPUTED' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs px-2"
                                onClick={() => handleApprovePayroll(payroll.id)}
                              >
                                Approve
                              </Button>
                            )}
                            {payroll.status === 'APPROVED' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs px-2"
                                onClick={() => handleReleasePayroll(payroll.id)}
                              >
                                Release
                              </Button>
                            )}
                            {payroll.status === 'RELEASED' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs px-2 text-red-600"
                                onClick={() => {
                                  const reason = prompt('Enter reason for voiding:');
                                  if (reason && reason.trim()) {
                                    handleVoidPayroll(payroll.id, reason.trim());
                                  }
                                }}
                              >
                                Void
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
