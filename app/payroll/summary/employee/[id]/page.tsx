'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { ArrowLeft, Download, FileText, XCircleIcon } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import Button from '@/components/ui/button/Button';
import PayrollInfoCard from '@/components/payroll/PayrollInfoCard';

interface EmployeePayrollData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  position?: string;
  baseSalary: number;
  company: {
    id: string;
    name: string;
    email?: string;
    contactNumber?: string;
    address?: string;
    logo?: string;
    website?: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
    lateMinutes: number;
    undertimeMinutes: number;
  };
  earnings: {
    basicSalary: number;
    overtimePay: number;
    holidayPay: number;
    nightDifferential: number;
    totalEarnings: number;
    regularHours: number;
    overtimeHours: number;
    nightDiffHours: number;
  };
  deductions: {
    sss: number;
    philhealth: number;
    pagibig: number;
    withholdingTax: number;
    lateDeduction: number;
    absenceDeduction: number;
    totalDeductions: number;
    governmentDeductions: number;
    policyDeductions: number;
  };
  netPay: number;
  status?: string;
  cutoffPeriod: {
    start: string;
    end: string;
  };
  workSchedule?: {
    monday: { start: string; end: string; };
    tuesday: { start: string; end: string; };
    wednesday: { start: string; end: string; };
    thursday: { start: string; end: string; };
    friday: { start: string; end: string; };
    saturday: { start: string; end: string; };
    sunday: { start: string; end: string; };
  };
  applicablePolicies?: {
    latePolicy: {
      type: string;
      deductionMethod: string;
      rate: number;
    };
    absencePolicy: {
      deductionMethod: string;
      rate: number;
    };
  };
}

function EmployeePayrollSummaryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const cutoff = searchParams.get('cutoff') || '';
  const department = searchParams.get('department') || '';

  const [payrollData, setPayrollData] = useState<EmployeePayrollData | null>(null);
  const [workSchedule, setWorkSchedule] = useState<any>(null);
  const [applicablePolicies, setApplicablePolicies] = useState<any>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  // Debug logging
  console.log('Component render - user:', user);
  console.log('Component render - user keys:', user ? Object.keys(user) : 'no user');
  console.log('Component render - employeeId:', employeeId);

  useEffect(() => {
    const fetchEmployeePayrollData = async () => {
      // Prevent duplicate calls
      if (isFetchingRef.current) {
        console.log('Already fetching, skipping...');
        return;
      }
      
      isFetchingRef.current = true;
      
      try {
        setIsLoading(true);
        setError(null);

        // Debug logging
        console.log('Debug - employeeId:', employeeId);
        console.log('Debug - user:', user);
        console.log('Debug - user keys:', user ? Object.keys(user) : 'no user');
        console.log('Debug - user.organizationId:', user?.organizationId);

        // Get query parameters
        const urlSearchParams = new URLSearchParams(window.location.search);
        let periodStart = urlSearchParams.get('periodStart') || cutoff;
        let periodEnd = urlSearchParams.get('periodEnd') || cutoff;
        const departmentId = urlSearchParams.get('departmentId') || department;
        
        console.log('URL search params:', Object.fromEntries(urlSearchParams.entries()));
        console.log('cutoff:', cutoff);
        console.log('Raw periodStart:', periodStart);
        console.log('Raw periodEnd:', periodEnd);
        
        // If we have cutoff but no period dates, try to parse it
        if (cutoff && !urlSearchParams.get('periodStart')) {
          // Parse cutoff format "2026-1-16-31" 
          // Format: YYYY-M-STARTDAY-ENDDAY where M is 1-based month (1=Jan, 2=Feb, etc.)
          const cutoffParts = cutoff.split('-');
          
          if (cutoffParts.length === 4) {
            const year = parseInt(cutoffParts[0]);
            const month = parseInt(cutoffParts[1]); // 1-based month
            const startDay = parseInt(cutoffParts[2]);
            const endDay = parseInt(cutoffParts[3]);
            
            console.log('Parsed cutoff:', { year, month, startDay, endDay });
            
            // Validate the parsed values
            if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
              const paddedMonth = String(month).padStart(2, '0');
              periodStart = `${year}-${paddedMonth}-${String(startDay).padStart(2, '0')}`;
              periodEnd = `${year}-${paddedMonth}-${String(endDay).padStart(2, '0')}`;
              
              console.log('Using cutoff dates:', { periodStart, periodEnd });
            } else {
              console.log('Invalid cutoff format, using current month');
              // Fallback to current month
              const currentDate = new Date();
              const fallbackYear = currentDate.getFullYear();
              const fallbackMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
              const lastDayOfMonth = new Date(fallbackYear, currentDate.getMonth() + 1, 0).getDate();
              
              periodStart = `${fallbackYear}-${fallbackMonth}-01`;
              periodEnd = `${fallbackYear}-${fallbackMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;
            }
          } else {
            console.log('Cutoff not in expected format, using current month');
            // Fallback to current month
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const lastDayOfMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
            
            periodStart = `${year}-${month}-01`;
            periodEnd = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;
          }
        }

        if (!employeeId) {
          throw new Error('Employee ID is missing');
        }

        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get organization ID from either new or old field name
        const organizationId = user.organizationId || (user as any).organization_id;
        
        if (!organizationId) {
          throw new Error('User organization ID is missing');
        }

        // Build API URL
        const apiUrl = `/api/payroll/employee/${employeeId}?organizationId=${organizationId}&periodStart=${periodStart}&periodEnd=${periodEnd}`;
        console.log('API URL:', apiUrl);
        console.log('Query params:', { organizationId, periodStart, periodEnd });

        // Call the API
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch payroll data');
        }

        const data = await response.json();
        setPayrollData(data);

        // Fetch work schedule
        const scheduleResponse = await fetch(`/api/payroll/employee/${employeeId}/schedule?organizationId=${organizationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setWorkSchedule(scheduleData);
        } else if (scheduleResponse.status === 404) {
          // No work schedule found - set a default schedule
          console.log('No work schedule found for employee');
          setWorkSchedule({
            monday: { start: '09:00', end: '18:00', isEnabled: true },
            tuesday: { start: '09:00', end: '18:00', isEnabled: true },
            wednesday: { start: '09:00', end: '18:00', isEnabled: true },
            thursday: { start: '09:00', end: '18:00', isEnabled: true },
            friday: { start: '09:00', end: '18:00', isEnabled: true },
            saturday: { start: '09:00', end: '18:00', isEnabled: false },
            sunday: { start: '09:00', end: '18:00', isEnabled: false },
          });
        } else {
          console.error('Failed to fetch work schedule');
        }

        // Fetch applicable policies
        const policiesResponse = await fetch(`/api/payroll/employee/${employeeId}/policies?organizationId=${organizationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (policiesResponse.ok) {
          const policiesData = await policiesResponse.json();
          setApplicablePolicies(policiesData);
        }
      } catch (err) {
        console.error('Error fetching employee payroll data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    // Only fetch if we have both employeeId and user, and auth is not loading
    console.log('Checking conditions:', {
      isAuthLoading,
      employeeId,
      user: !!user,
      userOrgId: user?.organizationId,
      userOrgIdOld: (user as any)?.organization_id, // Temporary fallback
      userEmail: user?.email
    });
    
    if (isAuthLoading) {
      // Still loading auth, don't do anything
      console.log('Auth is still loading...');
      return;
    }

    // Get organization ID from either new or old field name
    const organizationId = user?.organizationId || (user as any)?.organization_id;
    
    if (employeeId && organizationId) {
      console.log('All conditions met, fetching data...');
      fetchEmployeePayrollData();
    } else if (employeeId && !user) {
      console.log('Employee ID exists but no user');
      setError('User not authenticated');
      setIsLoading(false);
    } else if (!employeeId) {
      console.log('No employee ID');
      setError('Employee ID is missing from URL');
      setIsLoading(false);
    } else {
      console.log('Conditions not met:', { employeeId, user: !!user, orgId: !!organizationId, isAuthLoading });
    }
  }, [employeeId, cutoff, department, user?.organizationId, isAuthLoading]);

  const handleGeneratePayslip = () => {
    // TODO: Implement payslip generation
    alert('Generating payslip (demo - no actual action performed)');
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    alert('Downloading PDF (demo - no actual action performed)');
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">No payroll data found for this employee.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Employee Payroll Details" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          
          <div className="flex justify-between items-end mb-4">
            {/* this must be anchored to left */}
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Summary
            </Button>

            {/* this must be anchored the right */}
            <div className="flex gap-2">
              <Button onClick={handleGeneratePayslip}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Payslip
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Payroll Information Card */}
        <PayrollInfoCard
          employeeName={`${payrollData.firstName} ${payrollData.lastName}`}
          employeeId={payrollData.employeeId}
          organizationName={payrollData.company.name}
          payrollPeriod={{
            start: payrollData.cutoffPeriod.start,
            end: payrollData.cutoffPeriod.end
          }}
          payrollStatus={payrollData.status || 'PENDING'}
          className="mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Info & Attendance */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Employee Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{payrollData.departmentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium">{payrollData.position || 'N/A'}</p>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Attendance Summary</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Present Days:</span>
                      <span>{payrollData.attendance.presentDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Absent Days:</span>
                      <span className="font-bold text-red-600">{payrollData.attendance.absentDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Days:</span>
                      <span className="font-bold text-yellow-600">{payrollData.attendance.lateDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Minutes:</span>
                      <span className="font-bold text-yellow-600">{payrollData.attendance.lateMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Hours:</span>
                      <span>{payrollData.attendance.overtimeHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Undertime Minutes:</span>
                      <span>{payrollData.attendance.undertimeMinutes} min</span>
                    </div>
                  </div>
                </div>
                
                {/* Work Schedule */}
                {workSchedule && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Work Schedule</h4>
                    <div className="space-y-2 text-xs">
                      {[
                        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
                      ].map((day) => {
                        const schedule = workSchedule[day as keyof typeof workSchedule] as any;
                        return (
                          <div key={day} className="flex justify-between items-center">
                            <div className="font-medium capitalize w-12">{day.slice(0, 3)}</div>
                            <div className={`flex-1 mx-3 p-1 rounded text-center ${
                              schedule.isEnabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {schedule.isEnabled ? (
                                `${schedule.start} - ${schedule.end}`
                              ) : (
                                'Off'
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Earnings & Deductions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Earnings */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Earnings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-medium">₱{payrollData.earnings.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span className="font-medium">₱{payrollData.earnings.overtimePay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Holiday Pay:</span>
                    <span className="font-medium">₱{payrollData.earnings.holidayPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Night Differential:</span>
                    <span className="font-medium">₱{payrollData.earnings.nightDifferential.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-semibold">Total Earnings:</span>
                    <span className="font-bold text-green-600">₱{payrollData.earnings.totalEarnings.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Earnings Details */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Earnings Details</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Regular Hours:</span>
                      <span>{payrollData.earnings.regularHours} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Hours:</span>
                      <span>{payrollData.earnings.overtimeHours} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Night Diff Hours:</span>
                      <span>{payrollData.earnings.nightDiffHours} hours</span>
                    </div>
                    {payrollData.attendance.lateDays > 0 && (
                      <>
                        <div className="flex justify-between text-amber-600 pt-2 border-t">
                          <span>Expected Hours:</span>
                          <span>{payrollData.attendance.presentDays * 8} hours</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Hours per Present Day:</span>
                          <span>{(payrollData.earnings.regularHours / payrollData.attendance.presentDays).toFixed(1)} hrs</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Deductions</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Government Deductions */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium mb-2 text-sm text-blue-800 dark:text-blue-200">Government Deductions</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>SSS:</span>
                      <span className="font-medium">₱{payrollData.deductions.sss.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Philhealth:</span>
                      <span className="font-medium">₱{payrollData.deductions.philhealth.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pagibig:</span>
                      <span className="font-medium">₱{payrollData.deductions.pagibig.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Withholding Tax:</span>
                      <span className="font-medium">₱{payrollData.deductions.withholdingTax.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Policy Deductions */}
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                  <h4 className="font-medium mb-2 text-sm text-orange-800 dark:text-orange-200">Policy Deductions</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Late:</span>
                      <span className="font-medium">
                        {payrollData.deductions.lateDeduction > 0 ? (
                          <>₱{payrollData.deductions.lateDeduction.toLocaleString()}</>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Absence:</span>
                      <span className="font-medium">
                        {payrollData.deductions.absenceDeduction > 0 ? (
                          <>₱{payrollData.deductions.absenceDeduction.toLocaleString()}</>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Total Deductions */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Total Deductions:</span>
                    <span className="text-sm font-bold text-red-600">₱{payrollData.deductions.totalDeductions.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Gov't: ₱{payrollData.deductions.governmentDeductions.toLocaleString()} | 
                    Policy: ₱{payrollData.deductions.policyDeductions.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Pay */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <h3 className="text-lg font-semibold">Net Pay</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ₱{payrollData.netPay.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Total amount to be received
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Applicable Policies */}
            {applicablePolicies && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Applicable Policies</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Late Policy */}
                  {applicablePolicies.latePolicy && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <h4 className="font-medium mb-2 text-sm text-yellow-800 dark:text-yellow-200">Late Policy</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium">{applicablePolicies.latePolicy.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span className="font-medium">{applicablePolicies.latePolicy.deductionMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span className="font-medium">
                            {applicablePolicies.latePolicy.deductionMethod === 'HOURLY_RATE' 
                              ? `${applicablePolicies.latePolicy.rate}x hourly rate`
                              : `₱${applicablePolicies.latePolicy.rate}`
                            }
                          </span>
                        </div>
                        {applicablePolicies.latePolicy.gracePeriodMinutes !== undefined && (
                          <div className="flex justify-between">
                            <span>Grace Period:</span>
                            <span className="font-medium">{applicablePolicies.latePolicy.gracePeriodMinutes} minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Absence Policy */}
                  {applicablePolicies.absencePolicy && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <h4 className="font-medium mb-2 text-sm text-red-800 dark:text-red-200">Absence Policy</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span className="font-medium">{applicablePolicies.absencePolicy.deductionMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span className="font-medium">
                            {applicablePolicies.absencePolicy.deductionMethod === 'HOURLY_RATE' 
                              ? `${applicablePolicies.absencePolicy.rate}x hourly rate`
                              : `₱${applicablePolicies.absencePolicy.rate}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function EmployeePayrollSummaryPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <EmployeePayrollSummaryContent />
    </ProtectedRoute>
  );
}
