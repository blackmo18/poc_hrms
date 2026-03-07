'use client';

import TimeClock from '@/components/TimeClock';

export default function ClockInOutPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-4 sm:px-6 sm:py-8 sm:min-h-screen">
      <div className="max-w-lg mx-auto">
        <TimeClock />
      </div>
    </div>
  );
}
