import Badge, { BadgeColor } from '@/components/ui/badge/Badge';

interface OvertimeRecord {
  id: string;
  workDate: string;
  requestedMinutes: number;
  approvedMinutes: number | null;
  status: string;
  reason: string;
  remarks: string | null;
  approvedByUser?: {
    email: string;
  } | null;
  approvedAt: string | null;
}

interface OvertimeHistoryCardProps {
  record: OvertimeRecord;
}

export default function OvertimeHistoryCard({ record }: OvertimeHistoryCardProps) {
  const getStatusBadgeColor = (status: string): BadgeColor => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatApprovedBy = (approvedByUser: OvertimeRecord['approvedByUser']) => {
    if (!approvedByUser) return 'N/A';
    return approvedByUser.email;
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(record.workDate)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Requested: {record.requestedMinutes} min
            {record.approvedMinutes && ` | Approved: ${record.approvedMinutes} min`}
          </div>
        </div>
        <Badge color={getStatusBadgeColor(record.status)}>
          {getDisplayStatus(record.status)}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Reason:</span>
          <span className="ml-2 text-gray-900 dark:text-white">{record.reason}</span>
        </div>

        {record.remarks && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Remarks:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{record.remarks}</span>
          </div>
        )}

        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Approved By:</span>
          <span className="ml-2 text-gray-900 dark:text-white">{formatApprovedBy(record.approvedByUser)}</span>
        </div>

        {record.approvedAt && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Approved At:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{formatDate(record.approvedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
