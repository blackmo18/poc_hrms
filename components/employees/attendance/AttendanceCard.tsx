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

// Helper function to format timestamps in user-friendly way
const formatTime = (timeString: string) => {
  if (!timeString || timeString === '-') return '-';
  
  try {
    const date = new Date(timeString);
    // Format as 12-hour time with AM/PM
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila' // Show in Manila time
    });
  } catch (error) {
    return timeString; // Fallback to original string
  }
};

export default function AttendanceCard({
  record,
  onEditAttendance,
  getStatusColor
}: AttendanceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with Date and Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
            {new Date(record.date).toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(record.date).toLocaleDateString('en-US', { 
              year: 'numeric' 
            })}
          </p>
        </div>
        {record.status === '-' ? (
          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
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
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            In
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {formatTime(record.clockInAt)}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Out
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {formatTime(record.clockOutAt)}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.002 9.002 0 1112 21a9.002 9.002 0 019-7.745z" />
            </svg>
            Work
          </span>
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {record.totalWorkMinutes === 0 ? (
              <span className="text-gray-400 dark:text-gray-500">0 min</span>
            ) : (
              `${record.totalWorkMinutes} min`
            )}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => onEditAttendance(record)}
          className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white transition-colors"
        >
          <svg
            className="w-3 h-3"
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
