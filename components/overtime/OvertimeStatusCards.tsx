import ComponentCard from '@/components/common/ComponentCard';

interface OvertimeStatusCardsProps {
  pendingRequests?: number;
  approvedThisMonth?: number;
  totalApprovedHours?: number;
}

export default function OvertimeStatusCards({
  pendingRequests = 0,
  approvedThisMonth = 0,
  totalApprovedHours = 0,
}: OvertimeStatusCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <ComponentCard title="Pending Requests">
        <div className="p-6">
          <p className="mt-2 text-3xl font-bold text-orange-600">{pendingRequests}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Awaiting approval</p>
        </div>
      </ComponentCard>

      <ComponentCard title="Approved This Month">
        <div className="p-6">
          <p className="mt-2 text-3xl font-bold text-success-600">{approvedThisMonth}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">This month</p>
        </div>
      </ComponentCard>

      <ComponentCard title="Total OT Hours">
        <div className="p-6">
          <p className="mt-2 text-3xl font-bold text-brand-600">{totalApprovedHours}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Approved hours</p>
        </div>
      </ComponentCard>
    </div>
  );
}
