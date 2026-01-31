'use client';

import { useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

function PayrollRunContent() {
  const [selectedCutoff, setSelectedCutoff] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePayroll = async () => {
    if (!selectedCutoff || !selectedDepartment) {
      alert('Please select both cutoff period and department');
      return;
    }
    setIsGenerating(true);
    // TODO: Call API to generate payroll
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
              {/* Cutoff Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Cutoff Period</label>
                <select
                  value={selectedCutoff}
                  onChange={(e) => setSelectedCutoff(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Select cutoff period...</option>
                  <option value="jan-1-15">January 1-15, 2024</option>
                  <option value="jan-16-31">January 16-31, 2024</option>
                  <option value="feb-1-15">February 1-15, 2024</option>
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">Select department...</option>
                  <option value="engineering">Engineering</option>
                  <option value="sales">Sales</option>
                  <option value="hr">Human Resources</option>
                  <option value="operations">Operations</option>
                </select>
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
