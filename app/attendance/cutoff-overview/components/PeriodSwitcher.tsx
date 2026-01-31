'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CutoffPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
  status: 'In Progress' | 'Completed';
  totalHours: number;
  targetHours: number;
}

interface PeriodSwitcherProps {
  cutoffs: CutoffPeriod[];
  selectedCutoff: CutoffPeriod | null;
  onSelectCutoff: (cutoff: CutoffPeriod) => void;
}

export default function PeriodSwitcher({
  cutoffs,
  selectedCutoff,
  onSelectCutoff,
}: PeriodSwitcherProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex justify-end mb-6">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
        >
          {selectedCutoff?.label}
          <ChevronDown size={16} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
            {cutoffs.map((cutoff) => (
              <button
                key={cutoff.id}
                onClick={() => {
                  onSelectCutoff(cutoff);
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                  selectedCutoff?.id === cutoff.id ? 'bg-primary/10 dark:bg-primary/20' : ''
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{cutoff.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{cutoff.status}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
