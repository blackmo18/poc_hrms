'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, startOfDay, isWithinInterval,
  addMonths, subMonths, format
} from 'date-fns';
import CustomCell from './CustomCell';

// ... interfaces remain the same ...

const DragSelectCalendar = ({ 
  events = [], 
  disableDragSelect = false, 
  onCellClick,
  selectedDate,
  onRangeSelect
}: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selection, setSelection] = useState<{ start: Date | null; end: Date | null }>({
    start: null, end: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const isDraggingRef = useRef(false);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const handleMouseDown = (date: Date) => {
    if (disableDragSelect) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragStart(date);
    setSelection({ start: date, end: date });
  };

  const handleMouseEnter = (date: Date) => {
    if (!isDraggingRef.current || !dragStart) return;
    // Create a visual range regardless of direction
    const start = dragStart < date ? dragStart : date;
    const end = dragStart < date ? date : dragStart;
    setSelection({ start, end });
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragStart(null);
      // Optional: callback for range selection
      if (selection.start && selection.end) {
        onRangeSelect?.(selection.start, selection.end);
      }
      console.log("Range selected:", selection);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="w-full border-t border-l rounded-xl overflow-hidden shadow-sm select-none">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7" onMouseLeave={() => setIsDragging(false)} onMouseUp={handleMouseUp}>
        {days.map((day) => (
          <CustomCell
            key={day.toISOString()}
            date={day}
            isOutsideMonth={!isSameMonth(day, currentDate)}
            events={events.filter((e: any) => 
              isWithinInterval(startOfDay(day), { 
                start: startOfDay(new Date(e.startDate || e.date)), 
                end: startOfDay(new Date(e.endDate || e.date)) 
              })
            )}
            selectionRange={selection}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onCellClick={onCellClick}
            selectedDate={selectedDate}
            isDragging={isDragging}
          />
        ))}
      </div>
    </div>
  );
};

export default DragSelectCalendar;