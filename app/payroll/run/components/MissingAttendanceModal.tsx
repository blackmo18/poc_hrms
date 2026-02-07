import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Button from '@/components/ui/button/Button';

interface MissingAttendanceEmployee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  missingHours: number;
}

interface MissingAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
  departmentId?: string;
  cutoffPeriod: {
    start: string;
    end: string;
  } | null;
  onViewAttendance?: (employeeId: string) => void;
}

export function MissingAttendanceModal({
  isOpen,
  onClose,
  organizationId,
  departmentId,
  cutoffPeriod,
  onViewAttendance,
}: MissingAttendanceModalProps) {
  const [employees, setEmployees] = useState<MissingAttendanceEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && organizationId && cutoffPeriod) {
      fetchMissingAttendance();
    }
  }, [isOpen, organizationId, departmentId, cutoffPeriod]);

  const fetchMissingAttendance = async () => {
    if (!organizationId || !cutoffPeriod) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payroll/missing-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          organizationId,
          departmentId: departmentId || undefined,
          cutoffPeriod,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmployees(result.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch missing attendance data');
      }
    } catch (error) {
      console.error('Error fetching missing attendance:', error);
      setError('Failed to fetch missing attendance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAttendance = (employeeId: string) => {
    if (onViewAttendance) {
      onViewAttendance(employeeId);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Employees Missing Attendance Records</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Period: {cutoffPeriod ? `${cutoffPeriod.start} to ${cutoffPeriod.end}` : 'Not specified'}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No employees missing attendance records for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                      Employee ID
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start font-medium">
                      Name
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                      Department
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                      Missing Hours
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-medium">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.employeeId}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {employee.name}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.department}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {employee.missingHours}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAttendance(employee.id)}
                          className="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                        >
                          View Attendance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Modal>
  );
}
