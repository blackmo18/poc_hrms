'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DollarSign, Plus, Download, TrendingUp, TrendingDown } from 'lucide-react';

interface Payroll {
  id: string;
  period_start: string;
  period_end: string;
  gross_salary: number;
  net_salary: number;
  processed_at: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    department: {
      name: string;
    };
    jobTitle: {
      name: string;
    };
  };
  deductions: Array<{
    type: string;
    amount: number;
  }>;
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const response = await fetch('/api/payroll');
      if (response.ok) {
        const data = await response.json();
        setPayrolls(data);
      }
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGross = payrolls.reduce((sum, payroll) => sum + payroll.gross_salary, 0);
  const totalNet = payrolls.reduce((sum, payroll) => sum + payroll.net_salary, 0);
  const totalDeductions = totalGross - totalNet;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading payroll data...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-2">Manage employee payroll and compensation</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Process Payroll</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Gross Payroll
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${totalGross.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Net Payroll
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${totalNet.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Deductions
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-50">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${totalDeductions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll List */}
      <div className="space-y-4">
        {payrolls.map((payroll) => (
          <Card key={payroll.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {payroll.employee.first_name} {payroll.employee.last_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {payroll.employee.jobTitle.name} • {payroll.employee.department.name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Payslip
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="font-medium">
                    {new Date(payroll.period_start).toLocaleDateString()} - {new Date(payroll.period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gross Salary</p>
                  <p className="font-medium">${payroll.gross_salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Salary</p>
                  <p className="font-medium">${payroll.net_salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="font-medium">{new Date(payroll.processed_at).toLocaleDateString()}</p>
                </div>
              </div>

              {payroll.deductions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Deductions</p>
                  <div className="space-y-1">
                    {payroll.deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{deduction.type}</span>
                        <span>${deduction.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {payrolls.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payroll records</h3>
          <p className="text-gray-600 mb-4">Start by processing your first payroll.</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      )}
    </div>
  );
}
