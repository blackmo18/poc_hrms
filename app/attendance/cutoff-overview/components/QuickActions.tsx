'use client';

import { FileText, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <FileText className="text-primary mb-2" size={24} />
          <p className="font-semibold text-gray-900 dark:text-white">File Leave</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Request time off</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <Zap className="text-warning-500 mb-2" size={24} />
          <p className="font-semibold text-gray-900 dark:text-white">Request OT</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Apply for overtime</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <TrendingUp className="text-success-500 mb-2" size={24} />
          <p className="font-semibold text-gray-900 dark:text-white">View Past Slips</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Check payslips</p>
        </CardContent>
      </Card>
    </div>
  );
}
