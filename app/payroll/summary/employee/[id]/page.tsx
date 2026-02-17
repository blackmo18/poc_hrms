'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/protected-route';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { ArrowLeft, Download, FileText } from 'lucide-react';

interface EmployeePayrollData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  position?: string;
  baseSalary: number;
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
  };
  earnings: {
    basicSalary: number;
    overtimePay: number;
    holidayPay: number;
    nightDifferential: number;
    totalEarnings: number;
  };
  deductions: {
    sss: number;
    philhealth: number;
    pagibig: number;
    withholdingTax: number;
    totalDeductions: number;
  };
  netPay: number;
  cutoffPeriod: {
    start: string;
    end: string;
  };
}

function EmployeePayrollSummaryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const cutoff = searchParams.get('cutoff') || '';
  const department = searchParams.get('department') || '';

  const [employeeData, setEmployeeData] = useState<EmployeePayrollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching employee payroll data
    const fetchEmployeePayrollData = async () => {
      setIsLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/payroll/employee/${employeeId}?cutoff=${cutoff}&department=${department}`);
      
      // Mock data for demonstration
      setTimeout(() => {
        setEmployeeData({
          id: employeeId,
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          departmentName: 'Engineering',
          position: 'Senior Developer',
          baseSalary: 50000,
          attendance: {
            presentDays: 20,
            absentDays: 0,
            lateDays: 2,
            overtimeHours: 8,
          },
          earnings: {
            basicSalary: 50000,
            overtimePay: 2000,
            holidayPay: 0,
            nightDifferential: 500,
            totalEarnings: 52500,
          },
          deductions: {
            sss: 450,
            philhealth: 500,
            pagibig: 100,
            withholdingTax: 5000,
            totalDeductions: 6050,
          },
          netPay: 46450,
          cutoffPeriod: {
            start: '2024-01-16',
            end: '2024-01-31',
          },
        });
        setIsLoading(false);
      }, 1000);
    };

    if (employeeId) {
      fetchEmployeePayrollData();
    }
  }, [employeeId, cutoff, department]);

  const handleGeneratePayslip = () => {
    // TODO: Implement payslip generation
    alert('Generating payslip (demo - no actual action performed)');
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    alert('Downloading PDF (demo - no actual action performed)');
  };

  if (isLoading) {
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

  if (!employeeData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load payroll information for this employee.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageBreadcrumb pageTitle="Employee Payroll Summary" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {employeeData.lastName}, {employeeData.firstName}
              </h1>
              <p className="text-sm text-gray-600">
                {employeeData.employeeId} • {employeeData.position} • {employeeData.departmentName}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleGeneratePayslip}
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Payslip</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Payroll Period */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Payroll Period</p>
              <p className="text-lg font-semibold">
                {new Date(employeeData.cutoffPeriod.start).toLocaleDateString()} - {new Date(employeeData.cutoffPeriod.end).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Information & Attendance */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Information & Attendance</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{employeeData.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{employeeData.departmentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-medium">{employeeData.position}</p>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Attendance Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Present Days:</span>
                    <span className="font-medium text-green-600">{employeeData.attendance.presentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absent Days:</span>
                    <span className="font-medium text-red-600">{employeeData.attendance.absentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Days:</span>
                    <span className="font-medium text-yellow-600">{employeeData.attendance.lateDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Hours:</span>
                    <span className="font-medium">{employeeData.attendance.overtimeHours}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Earnings</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary:</span>
                  <span className="font-medium">₱{employeeData.earnings.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Pay:</span>
                  <span className="font-medium">₱{employeeData.earnings.overtimePay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Holiday Pay:</span>
                  <span className="font-medium">₱{employeeData.earnings.holidayPay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Night Differential:</span>
                  <span className="font-medium">₱{employeeData.earnings.nightDifferential.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="font-semibold">Total Earnings:</span>
                  <span className="font-bold text-green-600">₱{employeeData.earnings.totalEarnings.toLocaleString()}</span>
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>SSS:</span>
                  <span className="font-medium">₱{employeeData.deductions.sss.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Philhealth:</span>
                  <span className="font-medium">₱{employeeData.deductions.philhealth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagibig:</span>
                  <span className="font-medium">₱{employeeData.deductions.pagibig.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Withholding Tax:</span>
                  <span className="font-medium">₱{employeeData.deductions.withholdingTax.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="font-semibold">Total Deductions:</span>
                  <span className="font-bold text-red-600">₱{employeeData.deductions.totalDeductions.toLocaleString()}</span>
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
                  ₱{employeeData.netPay.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total amount to be received
                </p>
              </div>
            </CardContent>
          </Card>
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
