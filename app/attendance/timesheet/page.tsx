'use client';

import { Clock } from 'lucide-react';

export default function TimesheetPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
      <Clock className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Timesheet</h2>
      <p className="text-gray-600 dark:text-gray-400">Detailed timesheet view coming soon</p>
    </div>
  );
}
