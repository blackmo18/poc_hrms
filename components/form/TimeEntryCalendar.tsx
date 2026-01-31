'use client';

import React, { useState, useEffect } from 'react';
import { EventClickArg } from '@fullcalendar/core';
import Calendar from './Calendar';

interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface TimeEntryCalendarProps {
  onSelectTimeEntry: (timeEntry: TimeEntry) => void;
  selectedTimeEntryId?: string;
  daysToShow?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    timeEntry: TimeEntry;
  };
}

export default function TimeEntryCalendar({
  onSelectTimeEntry,
  selectedTimeEntryId,
  daysToShow = 30,
}: TimeEntryCalendarProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch time entries on mount
  useEffect(() => {
    fetchTimeEntries();
  }, []);

  // Convert time entries to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = timeEntries.map((entry) => ({
      id: entry.id,
      title: `${entry.startTime} - ${entry.endTime}`,
      start: `${entry.date}T${entry.startTime}`,
      end: `${entry.date}T${entry.endTime}`,
      extendedProps: {
        timeEntry: entry,
      },
    }));
    setEvents(calendarEvents);
  }, [timeEntries]);

  const fetchTimeEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get last 30 days from today
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

  const handleEventClick = (clickInfo: EventClickArg) => {
    const timeEntry = clickInfo.event.extendedProps.timeEntry as TimeEntry;
    onSelectTimeEntry(timeEntry);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {error && (
        <div className="m-4 rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-900/20 dark:text-error-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="m-4 text-center text-sm text-gray-500">
          Loading time entries...
        </div>
      )}

      <Calendar
        events={events}
        onEventClick={handleEventClick}
        initialView="dayGridMonth"
        height="auto"
        contentHeight="auto"
      />

      {/* Selected entry details */}
      {selectedTimeEntryId && (
        <div className="m-4 rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
          {(() => {
            const selected = timeEntries.find(
              (e) => e.id === selectedTimeEntryId
            );
            return selected ? (
              <div>
                <p className="text-sm font-semibold text-brand-900 dark:text-brand-100">
                  Selected Time Entry
                </p>
                <p className="mt-2 text-sm text-brand-800 dark:text-brand-200">
                  <span className="font-medium">Date:</span> {selected.date}
                </p>
                <p className="text-sm text-brand-800 dark:text-brand-200">
                  <span className="font-medium">Time:</span> {selected.startTime}{' '}
                  - {selected.endTime}
                </p>
                <p className="text-sm text-brand-800 dark:text-brand-200">
                  <span className="font-medium">Duration:</span>{' '}
                  {selected.duration} hours
                </p>
                <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">
                  <span className="font-medium">Entry ID:</span> {selected.id}
                </p>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
