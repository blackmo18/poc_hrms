import ComponentCard from '@/components/common/ComponentCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge, { BadgeColor } from '@/components/ui/badge/Badge';

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

interface AttendanceRecordsSectionProps {
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  onEditAttendance: (record: AttendanceRecord) => void;
  formatDuration: (minutes: number) => string;
  getStatusColor: (status: string) => BadgeColor;
}

export default function AttendanceRecordsSection({
  attendanceRecords,
  isLoading,
  error,
  onEditAttendance,
  formatDuration,
  getStatusColor
}: AttendanceRecordsSectionProps) {
  return (
    <ComponentCard title="Attendance Records">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading attendance records...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p>No attendance records found for this employee.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                  Work Date
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                  Clock In
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                  Clock Out
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-medium">
                  Total Work Minutes
                </TableCell>
                <TableCell className="px-4 py-3 text-center font-medium">
                  Status
                </TableCell>
                <TableCell className="px-4 py-3 text-center font-medium">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className=""
                >
                  <TableCell className="px-5 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {new Date(record.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {record.clockInAt === '-' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      record.clockInAt
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {record.clockOutAt === '-' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      record.clockOutAt
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {record.totalWorkMinutes === 0 ? (
                      <span className="text-gray-400">0 min</span>
                    ) : (
                      `${record.totalWorkMinutes} min (${formatDuration(record.totalWorkMinutes)})`
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    {record.status === '-' ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <Badge
                        size="sm"
                        color={getStatusColor(record.status)}
                      >
                        {record.status === 'weekend' ? 'Weekend' : record.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <button
                      onClick={() => onEditAttendance(record)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ComponentCard>
  );
}
