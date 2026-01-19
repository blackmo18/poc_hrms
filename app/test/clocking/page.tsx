'use client'

import TimeClock from '../../../components/TimeClock';

export default function ClockingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Clock</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300">Track your work hours and manage your daily time logs</p>
      </div>

      <div className="flex justify-center">
        <TimeClock />
      </div>
    </div>
  );
}