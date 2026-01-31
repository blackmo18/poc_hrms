'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  isBefore,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface CustomTimeEntryCalendarProps {
  onSelectTimeEntry: (timeEntry: TimeEntry) => void;
  selectedTimeEntryId?: string;
}

export default function CustomTimeEntryCalendar({
  onSelectTimeEntry,
  selectedTimeEntryId,
}: CustomTimeEntryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/timesheets?startDate=${startDateStr}&endDate=${endDateStr}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setTimeEntries(data.data || []);
      } else {
        setError('Failed to fetch time entries');
      }
    } catch (err) {
      setError('Error fetching time entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getEntriesForDate = (date: Date): TimeEntry[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeEntries.filter((entry) => entry.date === dateStr);
  };

  const hasEntries = (date: Date): boolean => {
    return getEntriesForDate(date).length > 0;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return isSameDay(date, currentMonth) || 
           (date >= monthStart && date <= monthEnd);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-sm text-gray-500">
            Loading time entries...
          </div>
        )}

        {!loading && (
          <div className="select-none">
            {/* Header with Month and Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="mb-2 grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const entries = getEntriesForDate(day);
                const hasEntry = entries.length > 0;
                const isCurrentMonthDay = isCurrentMonth(day);
                const isSelected = selectedTimeEntryId && 
                  entries.some(e => e.id === selectedTimeEntryId);

                return (
                  <div
                    key={idx}
                    className={`
                      relative h-24 rounded-lg border-2 p-2 transition-all cursor-pointer
                      ${!isCurrentMonthDay ? 'opacity-30 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800' : ''}
                      ${hasEntry && !isSelected ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 hover:border-blue-500 dark:hover:border-blue-500' : ''}
                      ${isSelected ? 'border-blue-600 bg-blue-100 dark:border-blue-500 dark:bg-blue-900/40 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                      ${!hasEntry && !isSelected ? 'bg-white dark:bg-white/[0.02]' : ''}
                    `}
                  >
                    {/* Date Number */}
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">
                      {format(day, 'd')}
                    </div>

                    {/* Time Entries */}
                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {entries.length > 0 ? (
                        entries.map((entry) => (
                          <div
                            key={entry.id}
                            onClick={() => onSelectTimeEntry(entry)}
                            className={`
                              text-xs px-2 py-1 rounded cursor-pointer transition-colors
                              ${isSelected && selectedTimeEntryId === entry.id
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700'
                              }
                            `}
                          >
                            <div className="font-medium">
                              {entry.startTime} - {entry.endTime}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {entry.duration}h
                            </div>
                          </div>
                        ))
                      ) : (
                        isCurrentMonthDay && (
                          <div className="text-xs text-gray-400 dark:text-gray-600">
                            No entries
                          </div>
                        )
                      )}
                    </div>

                    {/* Entry Count Indicator */}
                    {entries.length > 1 && (
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {entries.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Entry Details */}
      {selectedTimeEntryId && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Selected Entry Details
            </h3>
          </div>
          <div className="p-6">
            {(() => {
              const selected = timeEntries.find((e) => e.id === selectedTimeEntryId);
              return selected ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {format(new Date(selected.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {selected.startTime} - {selected.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {selected.duration} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Entry ID</p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {selected.id}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
