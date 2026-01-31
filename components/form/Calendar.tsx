'use client';

import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  EventInput,
  EventClickArg,
  EventContentArg,
} from '@fullcalendar/core';

interface CalendarEvent extends EventInput {
  extendedProps: {
    [key: string]: any;
  };
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (clickInfo: EventClickArg) => void;
  onEventContent?: (eventInfo: EventContentArg) => React.ReactNode;
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  height?: string | number;
  contentHeight?: string | number;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onEventClick,
  onEventContent,
  initialView = 'dayGridMonth',
  height = 'auto',
  contentHeight = 'auto',
  className = '',
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  const defaultEventContent = (eventInfo: EventContentArg) => {
    const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary'}`;
    return (
      <div
        className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
      >
        <div className="fc-daygrid-event-dot"></div>
        <div className="fc-event-time text-xs font-medium">{eventInfo.timeText}</div>
        <div className="fc-event-title text-xs">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className={`custom-calendar ${className}`}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={onEventClick}
        eventContent={onEventContent || defaultEventContent}
        height={height}
        contentHeight={contentHeight}
        editable={false}
        selectable={false}
      />
    </div>
  );
};

export default Calendar;
