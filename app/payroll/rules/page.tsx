'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { PlusIcon, EditIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function PayrollRulesContent() {
  const payrollRules = [
    {
      id: 1,
      ruleCode: 'OT_REGULAR',
      dayType: 'REGULAR_DAY',
      appliesTo: 'OVERTIME',
      multiplier: 1.25,
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: null,
      description: 'Overtime on regular days',
    },
    {
      id: 2,
      ruleCode: 'NIGHT_DIFF',
      dayType: 'REGULAR_DAY',
      appliesTo: 'NIGHT_DIFFERENTIAL',
      multiplier: 0.10,
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: null,
      description: 'Night differential (10 PM - 6 AM)',
    },
    {
      id: 3,
      ruleCode: 'HOLIDAY_REGULAR',
      dayType: 'REGULAR_HOLIDAY',
      appliesTo: 'HOLIDAY_PAY',
      multiplier: 2.0,
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: null,
      description: 'Regular holiday pay',
    },
    {
      id: 4,
      ruleCode: 'HOLIDAY_SPECIAL',
      dayType: 'SPECIAL_NON_WORKING',
      appliesTo: 'HOLIDAY_PAY',
      multiplier: 1.3,
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: null,
      description: 'Special non-working holiday pay',
    },
    {
      id: 5,
      ruleCode: 'OT_HOLIDAY',
      dayType: 'REGULAR_HOLIDAY',
      appliesTo: 'OVERTIME',
      multiplier: 1.69,
      effectiveFrom: 'Jan 1, 2024',
      effectiveTo: null,
      description: 'Overtime on regular holiday (2.0 x 1.25 - 0.56)',
    },
  ];

  return (
    <>
      <PageBreadcrumb pageTitle="Payroll Rules" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Payroll Rules Configuration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">PH labor law multipliers and rates</p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Add Rule
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">PH Labor Law Compliance</h3>
              <ul className="text-sm space-y-1">
                <li>✓ 8-hour regular workday</li>
                <li>✓ OT minimum 125% (1.25x)</li>
                <li>✓ Night differential +10%</li>
                <li>✓ Holiday multipliers encoded</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Active Rules</h3>
              <p className="text-2xl font-bold">{payrollRules.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">All rules are currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Payroll Rules</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rule Code</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-center py-3 px-4">Day Type</th>
                    <th className="text-center py-3 px-4">Applies To</th>
                    <th className="text-center py-3 px-4">Multiplier</th>
                    <th className="text-center py-3 px-4">Effective From</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRules.map((rule) => (
                    <tr key={rule.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <Badge color="primary" variant="light">
                          {rule.ruleCode}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{rule.description}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {rule.dayType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {rule.appliesTo.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-lg">
                        {rule.multiplier}x
                      </td>
                      <td className="py-3 px-4 text-center text-sm">{rule.effectiveFrom}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="outline" size="sm" className="flex items-center gap-1 mx-auto">
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Audit Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: Jan 15, 2024 by Admin User | All changes are audited and versioned
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function PayrollRulesPage() {
  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PayrollRulesContent />
    </ProtectedRoute>
  );
}
