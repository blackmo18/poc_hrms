'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { AlertCircleIcon, CheckCircleIcon, DownloadIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function ComplianceContent() {
  const statutoryTables = [
    {
      id: 1,
      name: 'SSS Contribution Table',
      type: 'SSS',
      effectiveDate: 'Jan 1, 2024',
      version: '2024-01',
      status: 'active',
      lastUpdated: 'Dec 28, 2023',
      description: 'Social Security System contribution rates and brackets',
    },
    {
      id: 2,
      name: 'PhilHealth Premium Table',
      type: 'PHILHEALTH',
      effectiveDate: 'Jan 1, 2024',
      version: '2024-01',
      status: 'active',
      lastUpdated: 'Dec 28, 2023',
      description: 'Philippine Health Insurance Corporation premium rates',
    },
    {
      id: 3,
      name: 'Pag-IBIG Contribution Table',
      type: 'PAG_IBIG',
      effectiveDate: 'Jan 1, 2024',
      version: '2024-01',
      status: 'active',
      lastUpdated: 'Dec 28, 2023',
      description: 'Home Development Mutual Fund contribution rates',
    },
    {
      id: 4,
      name: 'Income Tax Withholding Table',
      type: 'TAX',
      effectiveDate: 'Jan 1, 2024',
      version: '2024-01',
      status: 'active',
      lastUpdated: 'Dec 28, 2023',
      description: 'Bureau of Internal Revenue income tax withholding rates',
    },
  ];

  const complianceChecks = [
    {
      id: 1,
      name: 'Payroll Audit',
      description: 'Verify all payroll calculations comply with PH labor laws',
      lastRun: 'Jan 20, 2024',
      status: 'passed',
      issues: 0,
    },
    {
      id: 2,
      name: 'Statutory Deductions',
      description: 'Validate SSS, PhilHealth, Pag-IBIG, and tax deductions',
      lastRun: 'Jan 20, 2024',
      status: 'passed',
      issues: 0,
    },
    {
      id: 3,
      name: 'Holiday Compliance',
      description: 'Ensure holiday pay calculations follow PH regulations',
      lastRun: 'Jan 15, 2024',
      status: 'passed',
      issues: 0,
    },
    {
      id: 4,
      name: 'Overtime Regulations',
      description: 'Verify OT rates and approvals comply with labor code',
      lastRun: 'Jan 18, 2024',
      status: 'warning',
      issues: 2,
    },
  ];

  const getStatusColor = (status: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'warning':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Compliance & Statutory Tables" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            PH statutory tables, tax tables, and compliance audits
          </p>
        </div>

        {/* Compliance Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Tables</p>
              <p className="text-2xl font-bold mt-2">{statutoryTables.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Checks</p>
              <p className="text-2xl font-bold mt-2">{complianceChecks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Passed Checks</p>
              <p className="text-2xl font-bold mt-2 text-green-600">
                {complianceChecks.filter(c => c.status === 'passed').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Issues Found</p>
              <p className="text-2xl font-bold mt-2 text-yellow-600">
                {complianceChecks.reduce((sum, c) => sum + c.issues, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Statutory Tables */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Statutory Tables</h2>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <DownloadIcon className="w-4 h-4" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Table Name</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Version</th>
                    <th className="text-left py-3 px-4">Effective Date</th>
                    <th className="text-left py-3 px-4">Last Updated</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statutoryTables.map((table) => (
                    <tr key={table.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <p className="font-medium">{table.name}</p>
                        <p className="text-xs text-gray-500">{table.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color="primary" variant="light">
                          {table.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{table.version}</td>
                      <td className="py-3 px-4">{table.effectiveDate}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{table.lastUpdated}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge color="success" variant="light">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="outline" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Checks */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Compliance Audit Results</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceChecks.map((check) => (
                <div
                  key={check.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{check.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {check.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {check.status === 'passed' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
                      )}
                      <Badge color={getStatusColor(check.status)} variant="light">
                        {check.status === 'passed' ? 'Passed' : 'Warning'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t">
                    <p className="text-gray-600 dark:text-gray-400">
                      Last run: {check.lastRun}
                    </p>
                    {check.issues > 0 && (
                      <p className="text-yellow-600 font-medium">
                        {check.issues} issue{check.issues !== 1 ? 's' : ''} found
                      </p>
                    )}
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Info */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">PH Labor Law Compliance</h3>
            <ul className="text-sm space-y-1">
              <li>✓ All statutory tables updated to 2024 rates</li>
              <li>✓ SSS, PhilHealth, Pag-IBIG contributions configured</li>
              <li>✓ Income tax withholding tables current</li>
              <li>✓ Holiday pay multipliers per labor code</li>
              <li>✓ Overtime regulations enforced</li>
              <li>✓ All changes audited and versioned</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function CompliancePage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <ComplianceContent />
    </ProtectedRoute>
  );
}
