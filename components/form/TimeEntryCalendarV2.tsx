'use client';

import React, { useState, useEffect } from 'react';
import DragSelectCalendar from './DragSelectCalendar';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

interface TimeEntryCalendarV2Props {
  onSelectTimeEntry: (timeEntry: TimeEntry) => void;
  selectedTimeEntryId?: string;
}

export default function TimeEntryCalendarV2({
  onSelectTimeEntry,
  selectedTimeEntryId,
}: TimeEntryCalendarV2Props) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTimeEntries();
  }, []);

  const fetchTimeEntries = async () => {
    const startTime = Date.now();
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
        setTimeEntries(data.data?.filter(Boolean) || []);
      } else {
        setError('Failed to fetch time entries');
      }
    } catch (err) {
      setError('Error fetching time entries');
      console.error(err);
    } finally {
      // Ensure minimum loading time of 1.5 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1500 - elapsedTime);

      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const refreshTimeEntries = async () => {
    const startTime = Date.now();
    setBackgroundLoading(true);
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
        setTimeEntries(data.data?.filter(Boolean) || []);
      } else {
        setError('Failed to refresh time entries');
      }
    } catch (err) {
      setError('Error refreshing time entries');
      console.error(err);
    } finally {
      // Ensure minimum loading time of 1.5 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      setTimeout(() => {
        setBackgroundLoading(false);
      }, remainingTime);
    }
  };

  const convertToCalendarEvents = (): CalendarEvent[] => {
    return timeEntries.map((entry) => {
      const eventDate = new Date(entry.date);
      return {
        id: entry.id,
        title: `${entry.startTime} - ${entry.endTime}`,
        startDate: eventDate,
        endDate: eventDate,
      };
    });
  };

  const handleCellClick = (date: Date, events: CalendarEvent[]) => {
    setSelectedDate(date);
    // Reset selected entry when date changes
    if (selectedTimeEntryId) {
      onSelectTimeEntry(null as any);
    }
  };

  const getEntriesForSelectedDate = (): TimeEntry[] => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return timeEntries.filter((entry) => entry.date === dateStr);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-center text-sm text-gray-500">
            Loading time entries...
          </div>
        </div>
      ) : (
        <>
          {/* Calendar Section */}
          <div className="relative">
            <DragSelectCalendar
              disableEventClicks
              disableDragSelect
              events={convertToCalendarEvents()}
              onCellClick={handleCellClick}
              selectedDate={selectedDate}
            />

            {/* Background Loading Overlay */}
            {backgroundLoading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Refreshing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Selected Entry Details - Always visible */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {selectedDate ? `Entries for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}` : 'Entry Selection'}
              </h3>
            </div>
            <div className="p-6">
              {selectedDate ? (
                (() => {
                  const selectedDateEntries = getEntriesForSelectedDate();
                  return selectedDateEntries.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {selectedDateEntries.length} time {selectedDateEntries.length === 1 ? 'entry' : 'entries'} found
                      </p>
                      <div className="space-y-3">
                        {selectedDateEntries.map((entry) => (
                          <div
                            key={entry.id}
                            onClick={() => onSelectTimeEntry(entry)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                              selectedTimeEntryId === entry.id
                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <svg
                                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-white/90">
                                  {entry.startTime} - {entry.endTime}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Duration: {entry.duration} hours
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  ID: {entry.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        No entries found for this date
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Try selecting a different date
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    No date selected
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Click on a calendar cell above to view entries for that date
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
