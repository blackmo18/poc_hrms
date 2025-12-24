import { useState, useEffect, useRef } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  defaultYearOffset?: number;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  defaultYearOffset = 0
}: DatePickerProps) {
  const defaultDate = new Date();
  if (defaultYearOffset !== 0) {
    defaultDate.setFullYear(defaultDate.getFullYear() + defaultYearOffset);
  }
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(defaultDate.getMonth());
  const [currentYear, setCurrentYear] = useState(defaultDate.getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Update current month/year when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    }
  }, [value]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDateClick = (day: number) => {
    const selectedDate = formatDate(currentYear, currentMonth, day);
    onChange(selectedDate);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = value === formatDate(currentYear, currentMonth, day);
    const isToday = currentYear === new Date().getFullYear() &&
                    currentMonth === new Date().getMonth() &&
                    day === new Date().getDate();
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`w-10 h-10 text-sm rounded-lg hover:bg-brand-500 hover:text-white transition-colors ${
          isSelected ? 'bg-brand-500 text-white' : isToday ? 'ring-1 ring-brand-300 text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {day}
      </button>
    );
  }

  const inputClasses = `h-11 w-full rounded-lg border bg-transparent text-gray-800 border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 cursor-pointer ${className}`;

  return (
    <div className="relative" ref={calendarRef}>
      <input
        type="text"
        value={value ? new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : ''}
        onClick={() => !disabled && setShowCalendar(!showCalendar)}
        placeholder={placeholder}
        className={`${inputClasses} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        readOnly
        disabled={disabled}
      />

      {showCalendar && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              ‹
            </button>
            <div className="font-semibold text-gray-900 dark:text-white">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              ›
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="w-10 h-10 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </div>
      )}
    </div>
  );
}
