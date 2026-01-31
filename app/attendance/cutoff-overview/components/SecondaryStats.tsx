'use client';

import { Zap, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SecondaryStatsProps {
  otHours?: number;
  nightDifferential?: number;
  lates?: number;
  loading?: boolean;
}

export default function SecondaryStats({
  otHours = 0,
  nightDifferential = 0,
  lates = 0,
  loading = false,
}: SecondaryStatsProps) {
  const renderValue = (value: number) => {
    if (loading) {
      return <span className="animate-pulse">--</span>;
    }
    return `${value} hrs`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">OT Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {renderValue(otHours)}
              </p>
            </div>
            <Zap className="text-warning-500" size={32} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Night Differential</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {renderValue(nightDifferential)}
              </p>
            </div>
            <Clock className="text-primary" size={32} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Lates/Undertimes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {renderValue(lates)}
              </p>
            </div>
            <AlertCircle className="text-error-500" size={32} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
