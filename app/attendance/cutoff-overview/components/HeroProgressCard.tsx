'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CutoffPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
  status: 'In Progress' | 'Completed';
  totalHours: number;
  targetHours: number;
}

interface HeroProgressCardProps {
  selectedCutoff: CutoffPeriod | null;
  percentage: number;
  daysLeft: number;
  loading?: boolean;
}

export default function HeroProgressCard({
  selectedCutoff,
  percentage,
  daysLeft,
  loading = false,
}: HeroProgressCardProps) {
  if (!selectedCutoff) return null;

  return (
    <Card className="bg-transparent text-black dark:text-white shadow-xl mb-8 border-0">
      <CardHeader className="pb-4">
        <p className="opacity-60 text-sm font-medium">Target Hours</p>
        <h2 className="text-5xl font-bold mt-2">
          {loading ? (
            <span className="animate-pulse">--</span>
          ) : (
            <>
              {selectedCutoff.totalHours.toFixed(1)} <span className="text-2xl opacity-70">/ {selectedCutoff.targetHours} hrs</span>
            </>
          )}
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${loading ? 0 : percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${percentage.toFixed(0)}% of Cutoff reached`
            )}
          </span>
          <span className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded-full text-sm font-medium">
            {daysLeft} Days Left
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
