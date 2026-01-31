'use client';

import Badge from '@/components/ui/badge/Badge';
import { Card, CardContent } from '@/components/ui/card';

interface TimeEntry {
  date: string;
  clockInAt: string;
  clockOutAt: string;
  totalWorkMinutes: number;
  status: 'OPEN' | 'CLOSED';
  type: 'Regular' | 'Late' | 'OT' | 'Undertime';
}

interface DailyEntriesProps {
  entries: TimeEntry[];
  loading: boolean;
}

const getEntryTypeColor = (type: string): 'success' | 'warning' | 'primary' | 'error' | 'info' => {
  switch (type) {
    case 'Regular':
      return 'success';
    case 'Late':
      return 'warning';
    case 'OT':
      return 'primary';
    case 'Undertime':
      return 'error';
    default:
      return 'info';
  }
};

export default function DailyEntries({ entries, loading }: DailyEntriesProps) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Recent Entries</h3>
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading entries...</div>
      ) : entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{entry.date}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.clockInAt} - {entry.clockOutAt}
                    </p>
                  </div>
                  <Badge size="sm" color={getEntryTypeColor(entry.type)} variant="light">
                    {entry.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No entries for this cutoff period</div>
      )}
    </div>
  );
}
