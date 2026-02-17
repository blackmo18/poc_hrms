'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, XCircleIcon, FilterIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import OrganizationFilter from '@/components/common/OrganizationFilter';
import RoleComponentWrapper from '@/components/common/RoleComponentWrapper';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { BadgeColor } from "@/components/ui/badge/Badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';

function PayrollSummaryContent() {
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [periods, setPeriods] = useState<Array<{ id: string; label: string }>>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    totalEmployees: 0,
    governmentDeductions: 0,
    policyDeductions: 0,
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

  // Mock data with enhanced features
  const mockPayrollData = [
    {
      id: 1,
      employeeId: 'EMP001',
      employee: 'John Doe',
      department: 'Engineering',
      regularPay: 15000,
      otPay: 2500,
      nightDiff: 1200,
      holidayPay: 0,
      deductions: {
        tax: 1500,
        philhealth: 412.50,
        sss: 900,
        pagibig: 200,
        late: 150,
        absence: 0,
        total: 3162.50
      },
      netPay: 15500 - 150,
      status: 'pending',
      payrollPeriod: '2024-01-01 - 2024-01-15',
      metrics: {
        lateMinutes: 30,
        absences: 0,
        undertimeMinutes: 0
      }
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employee: 'Jane Smith',
      department: 'Sales',
      regularPay: 12000,
      otPay: 1800,
      nightDiff: 800,
      holidayPay: 2400,
      deductions: {
        tax: 1200,
        philhealth: 330,
        sss: 720,
        pagibig: 160,
        late: 0,
        absence: 1200,
        total: 3610
      },
      netPay: 14500 - 1200,
      status: 'approved',
      payrollPeriod: '2024-01-01 - 2024-01-15',
      metrics: {
        lateMinutes: 0,
        absences: 2,
        undertimeMinutes: 60
      }
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPayrollData(mockPayrollData);
      
      // Calculate summary stats
      const stats = mockPayrollData.reduce((acc, curr) => {
        const gross = curr.regularPay + curr.otPay + curr.nightDiff + curr.holidayPay;
        acc.totalGrossPay += gross;
        acc.totalDeductions += curr.deductions.total;
        acc.totalNetPay += curr.netPay;
        acc.governmentDeductions += curr.deductions.tax + curr.deductions.philhealth + curr.deductions.sss + curr.deductions.pagibig;
        acc.policyDeductions += curr.deductions.late + curr.deductions.absence;
        return acc;
      }, { totalGrossPay: 0, totalDeductions: 0, totalNetPay: 0, totalEmployees: mockPayrollData.length, governmentDeductions: 0, policyDeductions: 0 });
      
      setSummaryStats(stats);
      setIsLoading(false);
    }, 1000);
  }, [selectedOrganization, selectedDepartment, selectedPeriod]);

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Exporting payroll data...');
  };

  const handleApproveAll = () => {
    // TODO: Implement approve all functionality
    alert('Approving all payroll records...');
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

  return (
    <TooltipProvider>
      <>
        <PageBreadcrumb pageTitle="Payroll Summary" />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <FilterIcon className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Organization Filter */}
                <RoleComponentWrapper roles={ADMINSTRATIVE_ROLES} showFallback={false}>
                  <OrganizationFilter
                    selectedOrganization={selectedOrganization}
                    organizationOptions={organizationOptions}
                    onOrganizationChange={handleOrganizationChange}
                    disabled={isOrganizationFilterLoading}
                    showAllOption={showAllOption}
                  />
                </RoleComponentWrapper>
                
                {/* Department Filter */}
                <Select
                  value={selectedDepartment}
                  onChange={(value: any) => setSelectedDepartment(value)}
                  options={[
                    { value: 'all', label: 'All Departments' },
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'sales', label: 'Sales' },
                    { value: 'hr', label: 'Human Resources' },
                  ]}
                  placeholder="Select Department"
                />
                
                {/* Period Filter */}
                <Select
                  value={selectedPeriod}
                  onChange={(value: any) => setSelectedPeriod(value)}
                  options={[
                    { value: '2024-01-1-15', label: 'Jan 1-15, 2024' },
                    { value: '2024-01-16-31', label: 'Jan 16-31, 2024' },
                    { value: '2024-02-1-15', label: 'Feb 1-15, 2024' },
                  ]}
                  placeholder="Select Period"
                />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Gross Pay</p>
                <p className="text-2xl font-bold mt-2">₱ {summaryStats.totalGrossPay.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Gov't Deductions</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">₱ {summaryStats.governmentDeductions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Policy Deductions</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">₱ {summaryStats.policyDeductions.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Net Pay</p>
                <p className="text-2xl font-bold mt-2 text-green-600">₱ {summaryStats.totalNetPay.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                <p className="text-2xl font-bold mt-2">{summaryStats.totalEmployees}</p>
              </CardContent>
            </Card>
          </div>

        {/* Enhanced Payroll Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Payroll Details</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>Export</Button>
                <Button size="sm" onClick={handleApproveAll}>Approve All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-right py-3 px-4">Regular</th>
                    <th className="text-right py-3 px-4">OT</th>
                    <th className="text-right py-3 px-4">Night Diff</th>
                    <th className="text-right py-3 px-4">Holiday</th>
                    <th className="text-right py-3 px-4 font-semibold">Gross</th>
                    <th className="text-center py-3 px-4 bg-gray-50 dark:bg-gray-800" colSpan={6}>Deductions</th>
                    <th className="text-right py-3 px-4 font-semibold">Net</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-2 px-4"></th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">Tax</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">Phil</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">SSS</th>
                    <th className="text-right py-2 px-4 text-xs text-blue-600">PAG</th>
                    <th className="text-right py-2 px-4 text-xs text-orange-600">Late</th>
                    <th className="text-right py-2 px-4 text-xs text-orange-600">Abs</th>
                    <th className="text-right py-2 px-4 text-xs font-semibold">Total</th>
                    <th className="text-right py-2 px-4"></th>
                    <th className="text-center py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((row) => {
                    const grossPay = row.regularPay + row.otPay + row.nightDiff + row.holidayPay;
                    return (
                      <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{row.employee}</p>
                            <p className="text-xs text-gray-500">{row.employeeId} • {row.department}</p>
                            {/* Attendance indicators */}
                            <div className="flex items-center gap-1 mt-1">
                              {row.metrics.lateMinutes > 0 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge color="warning">
                                      ⏰ {row.metrics.lateMinutes}m
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Late: {row.metrics.lateMinutes} minutes</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {row.metrics.absences > 0 && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge color="error">
                                      ⚠ {row.metrics.absences}d
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Absent: {row.metrics.absences} days</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">₱ {row.regularPay.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">₱ {row.otPay.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">₱ {row.nightDiff.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">₱ {row.holidayPay.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-semibold">₱ {grossPay.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">₱ {row.deductions.tax.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">₱ {row.deductions.philhealth.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">₱ {row.deductions.sss.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 bg-blue-50 dark:bg-blue-900/20">₱ {row.deductions.pagibig.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                          {row.deductions.late > 0 ? (
                            <span className="text-orange-600">₱ {row.deductions.late.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="text-right py-3 px-4 bg-orange-50 dark:bg-orange-900/20">
                          {row.deductions.absence > 0 ? (
                            <span className="text-orange-600">₱ {row.deductions.absence.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="text-right py-3 px-4 bg-gray-50 dark:bg-gray-800 font-semibold text-red-600">₱ {row.deductions.total.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 font-semibold">₱ {row.netPay.toLocaleString()}</td>
                        <td className="text-center py-3 px-4">
                          {row.status === 'approved' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-yellow-600 mx-auto" />
                          )}
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
