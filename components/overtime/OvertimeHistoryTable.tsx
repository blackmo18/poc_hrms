import Badge, { BadgeColor } from '@/components/ui/badge/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

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

interface OvertimeHistoryTableProps {
  records: OvertimeRecord[];
}

export default function OvertimeHistoryTable({ records }: OvertimeHistoryTableProps) {
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
    <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Work Date
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Requested
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Approved
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reason
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Approved By
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Approved At
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(record.workDate)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {record.requestedMinutes}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {record.approvedMinutes || 'N/A'}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge color={getStatusBadgeColor(record.status)}>
                    {getDisplayStatus(record.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {record.reason}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatApprovedBy(record.approvedByUser)}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {record.approvedAt ? formatDate(record.approvedAt) : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
