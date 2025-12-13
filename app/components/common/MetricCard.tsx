import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  badge?: {
    text: string;
    color: 'success' | 'error' | 'warning' | 'info';
    icon?: LucideIcon;
  };
}

export default function MetricCard({
  id,
  title,
  value,
  icon: Icon,
  iconColor = 'text-gray-800 dark:text-white/90',
  iconBgColor = 'bg-gray-100 dark:bg-gray-800',
  badge,
}: MetricCardProps) {
  return (
    <div id={id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className={`flex items-center justify-center w-12 h-12 ${iconBgColor} rounded-xl`}>
        <Icon className={`size-6 ${iconColor}`} />
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
        </div>
        {badge && (
          <div className="flex items-center gap-1">
            {badge.icon && <badge.icon className="w-4 h-4" />}
            <span className={`text-xs font-medium ${
              badge.color === 'success' ? 'text-green-600 dark:text-green-400' :
              badge.color === 'error' ? 'text-red-600 dark:text-red-400' :
              badge.color === 'warning' ? 'text-orange-600 dark:text-orange-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {badge.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
