import ComponentCard from '@/components/common/ComponentCard';

interface EmployeeInfo {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  organization: string;
  position?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  clockInAt: string;
  clockOutAt: string;
  totalWorkMinutes: number;
  status: string;
  type: string;
  otHours: number;
  nightDifferential: number;
  lateHours: number;
  isAbsent?: boolean;
  isIncomplete?: boolean;
}

interface EmployeeDetailsSectionProps {
  employee: EmployeeInfo | null;
  attendanceRecords: AttendanceRecord[];
  calculateTotalWorkedHours: (records: AttendanceRecord[]) => string;
}

export default function EmployeeDetailsSection({
  employee,
  attendanceRecords,
  calculateTotalWorkedHours
}: EmployeeDetailsSectionProps) {
  return (
    <ComponentCard title="Employee Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Employee ID</p>
          {employee ? (
            <p className="font-medium">{employee.employeeId}</p>
          ) : (
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Employee Name</p>
          {employee ? (
            <p className="font-medium">{employee.name}</p>
          ) : (
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
          {employee ? (
            <p className="font-medium">{employee.organization}</p>
          ) : (
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
          {employee ? (
            <p className="font-medium">{employee.department}</p>
          ) : (
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
          {employee ? (
            <p className="font-medium">{employee.position || 'Not specified'}</p>
          ) : (
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Worked Hours</p>
          {employee ? (
            <p className="font-medium">{calculateTotalWorkedHours(attendanceRecords)}</p>
          ) : (
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
      </div>
    </ComponentCard>
  );
}
