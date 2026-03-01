'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  baseSalary: number;
  hasAttendance: boolean;
  hasWorkSchedule: boolean;
  lateMinutes: number;
  absenceCount: number;
}

interface EligibleEmployeesListProps {
  employees: Employee[];
  onEmployeeClick: (employeeId: string) => void;
}

export function EligibleEmployeesList({ employees, onEmployeeClick }: EligibleEmployeesListProps) {
  if (employees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold">Eligible Employees ({employees.length})</h3>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {employees.map((employee) => (
            <Tooltip key={employee.id}>
              <TooltipTrigger asChild>
                <div 
                  onClick={() => onEmployeeClick(employee.id)}
                  className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{employee.lastName}, {employee.firstName}</span>
                    <span className="text-gray-400">({employee.employeeId})</span>
                    <div className="flex items-center space-x-1">
                      {employee.hasAttendance ? (
                        <span className="text-green-600" title="Has attendance">✓</span>
                      ) : (
                        <span className="text-red-600" title="Missing attendance">✗</span>
                      )}
                      {employee.hasWorkSchedule ? (
                        <span className="text-blue-600" title="Has work schedule">◉</span>
                      ) : (
                        <span className="text-orange-600" title="Missing work schedule">○</span>
                      )}
                      {employee.lateMinutes > 0 && (
                        <span className="text-yellow-600" title={`Late: ${employee.lateMinutes} minutes`}>⏰</span>
                      )}
                      {employee.absenceCount > 0 && (
                        <span className="text-red-600" title={`Absent: ${employee.absenceCount} days`}>⚠</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-500">₱{employee.baseSalary.toLocaleString()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to generate employee payroll summary</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
