'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function PayrollSummaryContent() {
  const payrollData = [
    {
      id: 1,
      employee: 'John Doe',
      department: 'Engineering',
      regularPay: 15000,
      otPay: 2500,
      nightDiff: 1200,
      holidayPay: 0,
      deductions: 3200,
      netPay: 15500,
      status: 'pending',
    },
    {
      id: 2,
      employee: 'Jane Smith',
      department: 'Sales',
      regularPay: 12000,
      otPay: 1800,
      nightDiff: 800,
      holidayPay: 2400,
      deductions: 2500,
      netPay: 14500,
      status: 'approved',
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Payroll Summary" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gross Pay</p>
              <p className="text-2xl font-bold mt-2">₱ 47,700</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deductions</p>
              <p className="text-2xl font-bold mt-2">₱ 5,700</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Net Pay</p>
              <p className="text-2xl font-bold mt-2">₱ 42,000</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
              <p className="text-2xl font-bold mt-2">45</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Payroll Details</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Export</Button>
                <Button size="sm">Approve All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-right py-3 px-4">Regular Pay</th>
                    <th className="text-right py-3 px-4">OT Pay</th>
                    <th className="text-right py-3 px-4">Night Diff</th>
                    <th className="text-right py-3 px-4">Holiday Pay</th>
                    <th className="text-right py-3 px-4">Deductions</th>
                    <th className="text-right py-3 px-4">Net Pay</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{row.employee}</p>
                          <p className="text-xs text-gray-500">{row.department}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">₱ {row.regularPay.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">₱ {row.otPay.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">₱ {row.nightDiff.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">₱ {row.holidayPay.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">₱ {row.deductions.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 font-semibold">₱ {row.netPay.toLocaleString()}</td>
                      <td className="text-center py-3 px-4">
                        {row.status === 'approved' ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-yellow-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function PayrollSummaryPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PayrollSummaryContent />
    </ProtectedRoute>
  );
}
