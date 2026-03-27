'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Calendar from '@/components/form/Calendar';
import { LeaveRequest } from '@/components/leave/LeaveTable';
import Badge from '@/components/ui/badge/Badge';
import { formatUTCDateToReadable } from '@/lib/utils/date-utils';
import { Modal } from '@/components/ui/modal';

// Map leave type to TailAdmin calendar color classes
const leaveTypeCalendarMap: Record<string, string> = {
  VACATION: 'primary',
  SICK: 'danger',
  EMERGENCY: 'warning',
  MATERNITY: 'success',
  PATERNITY: 'primary',
  BEREAVEMENT: 'danger',
  UNPAID: 'warning',
};

// Status-based color mapping (takes priority over leave type)
const statusCalendarMap: Record<string, string> = {
  PENDING: 'warning',    // Yellow/Orange for pending approval
  APPROVED: 'success',   // Green for approved
  REJECTED: 'error',     // Red for rejected
  CANCELLED: 'dark',     // Gray for cancelled
};

const statusBadgeColor: Record<string, any> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'dark',
};

interface SelectedEvent {
  title: string;
  start: string;
  end: string;
  leaveType: string;
  status: string;
  employeeName: string;
  employeeId: string;
  remarks?: string;
  department?: string;
}

export default function LeaveCalendarPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
    setIsMounted(true); // Set mounted state for portal support
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leave-requests');
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
        const events = convertToEvents(data);
        setCalendarEvents(events);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToEvents = (requests: LeaveRequest[]) => {
    return requests.map((req) => {
      // Priority: Status color takes precedence over leave type color
      const calendarColor = statusCalendarMap[req.status] || leaveTypeCalendarMap[req.leaveType] || 'primary';

      // Add 1 day to end date so FullCalendar includes it
      const endDate = new Date(req.endDate);
      endDate.setDate(endDate.getDate() + 1);

      return {
        id: req.id,
        title: `${req.employee.firstName} ${req.employee.lastName} - ${req.leaveType}`,
        start: req.startDate,
        end: endDate.toISOString().split('T')[0],
        allDay: true,
        extendedProps: {
          calendar: calendarColor,
          leaveType: req.leaveType,
          status: req.status,
          employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
          employeeId: req.employee.employeeId || '',
          remarks: req.remarks,
          department: req.employee.department?.name,
        },
      };
    });
  };

  const handleEventClick = (clickInfo: any) => {
    const { extendedProps } = clickInfo.event;
    setSelectedEvent({
      title: clickInfo.event.title,
      start: clickInfo.event.start?.toISOString() || '',
      end: clickInfo.event.end?.toISOString() || '',
      leaveType: extendedProps.leaveType,
      status: extendedProps.status,
      employeeName: extendedProps.employeeName,
      employeeId: extendedProps.employeeId,
      remarks: extendedProps.remarks,
      department: extendedProps.department,
    });
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading leave calendar...</div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
            Leave Calendar
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View leave requests on a calendar
          </p>
        </div>

        {/* Status Legend */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status Legend</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Pending Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
      <Calendar
        events={calendarEvents}
        onEventClick={handleEventClick}
        className="leave-calendar"
      />
      
      {/* Modal rendered via portal to prevent layout shift */}
      {isMounted && createPortal(
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          className="max-w-[600px] p-6 lg:p-8"
        >
          {selectedEvent && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                    {selectedEvent.employeeName}
                  </h3>
                  <div className="mt-2">
                    <Badge size="sm" color={statusBadgeColor[selectedEvent.status]}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <p className="font-medium text-gray-800 dark:text-white/90">{selectedEvent.leaveType}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <div className="mt-0.5">
                    <Badge size="sm" color={statusBadgeColor[selectedEvent.status]}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Start</span>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {formatUTCDateToReadable(selectedEvent.start)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">End</span>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {formatUTCDateToReadable(selectedEvent.end)}
                  </p>
                </div>
                {selectedEvent.department && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Department</span>
                    <p className="font-medium text-gray-800 dark:text-white/90">{selectedEvent.department}</p>
                  </div>
                )}
                {selectedEvent.employeeId && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Employee ID</span>
                    <p className="font-medium text-gray-800 dark:text-white/90">{selectedEvent.employeeId}</p>
                  </div>
                )}
              </div>
              {selectedEvent.remarks && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Remarks</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                    &ldquo;{selectedEvent.remarks}&rdquo;
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>,
        document.body
      )}
    </>
  );
}
