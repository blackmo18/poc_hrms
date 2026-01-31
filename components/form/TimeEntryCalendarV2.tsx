'use client';

import React, { useState, useEffect } from 'react';
import DragSelectCalendar from './DragSelectCalendar';
import SelectedEntriesSection from './SelectedEntriesSection';
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
  onRangeSelect?: (start: Date, end: Date) => void;
}

export default function TimeEntryCalendarV2({
  onSelectTimeEntry,
  selectedTimeEntryId,
  onRangeSelect
}: TimeEntryCalendarV2Props) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleRangeSelect = async (start: Date, end: Date) => {
    try {
      const response = await fetch('/api/overtime-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd')
        }),
        credentials: 'include'
      });
      if (response.ok) {
        console.log('Overtime request saved successfully');
        // Optionally show success message
      } else {
        console.error('Failed to save overtime request');
        setError('Failed to save overtime request');
      }
    } catch (err) {
      console.error('Error saving overtime request:', err);
      setError('Error saving overtime request');
    }
  };

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
          <SelectedEntriesSection
            selectedDate={selectedDate}
            timeEntries={timeEntries}
            onSelectTimeEntry={onSelectTimeEntry}
            selectedTimeEntryId={selectedTimeEntryId}
          />
        </>
      )}
    </div>
  );
}
