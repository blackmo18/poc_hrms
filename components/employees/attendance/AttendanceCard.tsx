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

interface AttendanceCardProps {
  record: AttendanceRecord;
  onEditAttendance: (record: AttendanceRecord) => void;
  getStatusColor: (status: string) => BadgeColor;
}

export default function AttendanceCard({
  record,
  onEditAttendance,
  getStatusColor
}: AttendanceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with Date and Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
            {new Date(record.date).toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {new Date(record.date).toLocaleDateString('en-US', { 
              year: 'numeric' 
            })}
          </p>
        </div>
        {record.status === '-' ? (
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            -
          </span>
        ) : (
          <Badge
            size="sm"
            color={getStatusColor(record.status)}
          >
            {record.status === 'weekend' ? 'Weekend' : record.status}
          </Badge>
        )}
      </div>

      {/* Time Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clock In
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {record.clockInAt === '-' ? (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            ) : (
              record.clockInAt
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clock Out
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {record.clockOutAt === '-' ? (
              <span className="text-gray-400 dark:text-gray-500">-</span>
            ) : (
              record.clockOutAt
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.002 9.002 0 1112 21a9.002 9.002 0 019-7.745z" />
            </svg>
            Work Time
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {record.totalWorkMinutes === 0 ? (
              <span className="text-gray-400 dark:text-gray-500">0 min</span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400">
                {record.totalWorkMinutes} min
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => onEditAttendance(record)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
          title="Edit attendance"
        >
          <svg
            className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
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
      </div>
    </div>
  );
}
