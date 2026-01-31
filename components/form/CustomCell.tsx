'use client';
import { format, isSameDay, isWithinInterval, startOfDay } from 'date-fns';

const CustomCell = ({ 
  date, events, selectionRange, onMouseDown, onMouseEnter, onMouseUp,
  isOutsideMonth, onCellClick, selectedDate, isDragging 
}: any) => {
  const MAX_EVENTS = 2;
  const day = startOfDay(date);

  // Determine status based on selectionRange
  let status = 'none';
  if (selectionRange.start && selectionRange.end) {
    const start = selectionRange.start;
    const end = selectionRange.end;
    if (isSameDay(day, start) && isSameDay(day, end)) {
      status = 'single';
    } else if (isSameDay(day, start)) {
      status = 'start';
    } else if (isSameDay(day, end)) {
      status = 'end';
    } else if (isWithinInterval(day, { start, end })) {
      status = 'between';
    }
  }

  const styles = {
    base: "h-24 border-r border-b p-1 transition-colors relative cursor-pointer",
    start: "bg-blue-600 text-white rounded-l-lg z-10 shadow-md",
    end: "bg-blue-600 text-white rounded-r-lg z-10 shadow-md",
    single: "bg-blue-600 text-white rounded-lg z-10 shadow-md",
    between: "bg-blue-100 text-blue-700 dark:bg-blue-900/40",
    none: isOutsideMonth ? 'bg-gray-50 text-gray-400 dark:bg-gray-800/50' : 'bg-white text-gray-700 dark:bg-gray-900'
  };

  const getEventStatus = (event: any) => {
    const s = startOfDay(new Date(event.startDate || event.date));
    const e = startOfDay(new Date(event.endDate || event.date));
    if (isSameDay(day, s) && isSameDay(day, e)) return 'single';
    if (isSameDay(day, s)) return 'start';
    if (isSameDay(day, e)) return 'end';
    if (isWithinInterval(day, { start: s, end: e })) return 'middle';
    return null;
  };

  const isSelected = selectedDate && isSameDay(day, selectedDate);

  return (
    <div
      onMouseDown={() => onMouseDown(day)}
      onMouseEnter={() => onMouseEnter(day)}
      onMouseUp={onMouseUp}
      onClick={() => onCellClick?.(day, events)}
      className={`${styles.base} ${styles[status]} ${isSelected ? 'ring-2 ring-inset ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
          isSameDay(day, new Date()) ? 'bg-blue-600 text-white' : ''
        }`}>
          {format(day, 'd')}
        </span>
      </div>

      <div className="mt-1 space-y-0.5">
        {events.slice(0, MAX_EVENTS).map((event: any) => {
          const status = getEventStatus(event);
          if (!status) return null;

          return (
            <div
              key={event.id}
              className={`text-[9px] h-4 flex items-center px-1 truncate
                ${status === 'start' || status === 'single' ? 'rounded-l ml-0.5' : ''}
                ${status === 'end' || status === 'single' ? 'rounded-r mr-0.5' : ''}
                ${status === 'middle' ? 'border-l border-indigo-400/20' : ''}
                bg-indigo-500 text-white
              `}
            >
              {(status === 'start' || status === 'single') && event.title}
            </div>
          );
        })}
        {events.length > MAX_EVENTS && (
          <div className="text-[9px] text-gray-500 font-bold pl-1">
            +{events.length - MAX_EVENTS} more
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomCell;