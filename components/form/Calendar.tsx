'use client';

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import { formatUTCDateToReadable } from "@/lib/utils/date-utils";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    leaveType?: string;
    status?: string;
    employeeName?: string;
    employeeId?: string;
    remarks?: string;
    department?: string;
  };
}

interface CalendarProps {
  events?: any[];
  onEventClick?: (clickInfo: EventClickArg) => void;
  initialView?: string;
  height?: string | number;
  contentHeight?: string | number;
  className?: string;
  showEventModal?: boolean;
}

const statusBadgeColor: Record<string, any> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'dark',
};

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onEventClick,
  initialView = 'dayGridMonth',
  height = 'auto',
  contentHeight = 'auto',
  className = '',
  showEventModal = false,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    // Convert external events to calendar events format
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      extendedProps: event.extendedProps || {},
    }));
    setCalendarEvents(formattedEvents);
  }, [events]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setEventTitle("");
    setEventStartDate(selectInfo.startStr.split("T")[0]);
    setEventEndDate(selectInfo.endStr.split("T")[0]);
    setEventLevel("primary");
    setSelectedEvent(null);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // Always call the external onEventClick handler
    if (onEventClick) {
      onEventClick(clickInfo);
    }
    
    // Handle internal modal if enabled
    if (showEventModal) {
      const event = clickInfo.event;
      setSelectedEvent(event as unknown as CalendarEvent);
      setEventTitle(event.title);
      setEventStartDate(event.start?.toISOString().split("T")[0] || "");
      setEventEndDate(event.end?.toISOString().split("T")[0] || "");
      setEventLevel(event.extendedProps.calendar || "primary");
      openModal();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleSaveEvent = () => {
    if (selectedEvent) {
      // Edit existing event
      setCalendarEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : event
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      };
      setCalendarEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar?.toLowerCase() || 'primary'}`;
    
    // Determine if this is a leave event with status
    const { extendedProps } = eventInfo.event;
    const isLeaveEvent = extendedProps.leaveType && extendedProps.status;
    const status = extendedProps.status;
    
    return (
      <div
        className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm relative`}
      >
        <div className="fc-daygrid-event-dot"></div>
        
        {/* Show status indicator for leave events */}
        {isLeaveEvent && (
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current opacity-60"></div>
        )}
        
        <div className="fc-event-title text-xs truncate flex-1">
          {eventInfo.event.title}
        </div>
        
        {/* Show status badge for pending leave events */}
        {isLeaveEvent && status === 'PENDING' && (
          <div className="text-xs opacity-75 ml-1">⏳</div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={calendarEvents}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          customButtons={{
            addEventButton: {
              text: "Add Event +",
              click: openModal,
            },
          }}
        />
      </div>
      
      {/* Modal - exactly like React Tailwind Admin */}
      {showEventModal && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on
                track
              </p>
            </div>
            
            {/* Event Details Display (for leave events) */}
            {selectedEvent && selectedEvent.extendedProps.leaveType && (
              <div className="mt-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {selectedEvent.extendedProps.employeeName || selectedEvent.title}
                  </h3>
                  {selectedEvent.extendedProps.status && (
                    <div className="mt-2">
                      <Badge size="sm" color={statusBadgeColor[selectedEvent.extendedProps.status]}>
                        {selectedEvent.extendedProps.status}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Start Date</span>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {formatUTCDateToReadable(selectedEvent.start?.toString() || '')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">End Date</span>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {formatUTCDateToReadable(selectedEvent.end?.toString() || '')}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.extendedProps.leaveType && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Leave Type</span>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {selectedEvent.extendedProps.leaveType}
                      </p>
                    </div>
                  )}

                  {selectedEvent.extendedProps.employeeName && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Employee</span>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {selectedEvent.extendedProps.employeeName}
                      </p>
                    </div>
                  )}

                  {selectedEvent.extendedProps.department && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Department</span>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {selectedEvent.extendedProps.department}
                      </p>
                    </div>
                  )}

                  {selectedEvent.extendedProps.employeeId && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Employee ID</span>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {selectedEvent.extendedProps.employeeId}
                      </p>
                    </div>
                  )}

                  {selectedEvent.extendedProps.remarks && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Remarks</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                        "{selectedEvent.extendedProps.remarks}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Event Form (for regular events) */}
            {(!selectedEvent || !selectedEvent.extendedProps.leaveType) && (
              <div className="mt-8">
                <div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Event Title
                    </label>
                    <input
                      id="event-title"
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                  
                  <div className="mt-5">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Start Date
                    </label>
                    <input
                      id="event-start-date"
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                  
                  <div className="mt-5">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      End Date
                    </label>
                    <input
                      id="event-end-date"
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  </div>
                  
                  <div className="mt-5">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Event Color
                    </label>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                      {Object.entries({
                        Danger: "danger",
                        Success: "success",
                        Primary: "primary",
                        Warning: "warning",
                      }).map(([key, value]) => (
                        <div key={key} className="n-chk">
                          <div
                            className={`form-check form-check-${value} form-check-inline`}
                          >
                            <input
                              className="form-check-input"
                              type="radio"
                              name="event-color"
                              value={value}
                              checked={eventLevel === value}
                              onChange={(e) => setEventLevel(e.target.value)}
                            />
                            <label className="form-check-label">
                              {key}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              {!selectedEvent?.extendedProps.leaveType && (
                <button
                  onClick={handleSaveEvent}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-brand-500 rounded-lg hover:bg-brand-600 dark:bg-brand-500 dark:border-brand-500 dark:hover:bg-brand-600"
                >
                  {selectedEvent ? "Update" : "Save"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Calendar;
