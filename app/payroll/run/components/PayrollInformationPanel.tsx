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

interface PayrollInformationPanelProps {
  selectedCutoff: string;
  eligibleEmployeesCount: number;
  canGenerate: boolean;
  lastGeneratedAt?: string;
  eligibleEmployees?: Employee[];
  onEmployeeClick?: (employeeId: string) => void;
  periodStatus?: 'DRAFT' | 'COMPUTED' | 'APPROVED' | 'RELEASED' | 'VOIDED';
}

export function PayrollInformationPanel({
  selectedCutoff,
  eligibleEmployeesCount,
  canGenerate,
  lastGeneratedAt,
  eligibleEmployees = [],
  onEmployeeClick,
  periodStatus
}: PayrollInformationPanelProps) {
  console.log('[PayrollInformationPanel] periodStatus:', periodStatus);
  
  const formatCutoffDisplay = (cutoff: string) => {
    if (!cutoff) return 'Not selected';
    
    const parts = cutoff.split('-');
    const year = parts[0];
    const month = parseInt(parts[1]) - 1;
    const startDay = parts[2];
    const endDay = parts[3];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[month]} ${startDay} - ${endDay}, ${year}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return 'text-gray-600';
      case 'COMPUTED':
        return 'text-blue-600';
      case 'APPROVED':
        return 'text-yellow-600';
      case 'RELEASED':
        return 'text-green-600';
      case 'VOIDED':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'COMPUTED':
        return 'Computed';
      case 'APPROVED':
        return 'Approved';
      case 'RELEASED':
        return 'Released';
      case 'VOIDED':
        return 'Voided';
      default:
        return 'Not Started';
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold">Payroll Information</h3>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Current Period</p>
          <p className="font-medium">{formatCutoffDisplay(selectedCutoff)}</p>
        </div>
        
        {periodStatus && (
          <div>
            <p className="text-gray-600 dark:text-gray-400">Period Status</p>
            <p className={`font-medium ${getStatusColor(periodStatus)}`}>
              {getStatusText(periodStatus)}
            </p>
          </div>
        )}
        
        <div>
          <p className="text-gray-600 dark:text-gray-400">Employees Ready for Payroll</p>
          <p className="font-medium">{eligibleEmployeesCount} eligible employees</p>
        </div>
        
        <div>
          <p className="text-gray-600 dark:text-gray-400">Status</p>
          <p className={`font-medium ${canGenerate ? 'text-green-600' : 'text-yellow-600'}`}>
            {canGenerate ? 'Ready to Generate' : 'Pending Generation'}
          </p>
        </div>
        
        {/* Display eligible employees list */}
        {eligibleEmployees.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">Eligible Employees ({eligibleEmployees.length})</p>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {eligibleEmployees.map((employee) => (
                <Tooltip key={employee.id}>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={() => onEmployeeClick?.(employee.id)}
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
          </div>
        )}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Last generated: {lastGeneratedAt 
              ? new Date(lastGeneratedAt).toLocaleDateString()
              : 'Never'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
