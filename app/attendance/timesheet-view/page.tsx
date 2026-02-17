'use client';

import { useState, useEffect } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FilterIcon } from 'lucide-react';
import AttendanceRecordsSection from '@/components/employees/attendance/AttendanceRecordsSection';
import { useAuth } from '@/components/providers/auth-provider';
import Badge, { BadgeColor } from '@/components/ui/badge/Badge';
import PeriodSelectionSection from '@/components/employees/attendance/PeriodSelectionSection';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';

interface AttendanceRecord {
  id: string;
  date: string;
  clockInAt: string;
  clockOutAt: string;
  totalWorkMinutes: number;
  status: string;
  type: string;
  otHours: number;
  nightDifferential: number;
  lateHours: number;
  isAbsent?: boolean;
  isIncomplete?: boolean;
}

export default function TimesheetViewPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Period selection state
  const { periods: payrollPeriods, currentPeriod } = usePayrollPeriods({
    lookbackPeriods: 2, // Include 2 periods back
    lookaheadPeriods: 2, // Include 2 periods forward
    includeCurrentPeriod: true // Include current period
  });

  const [selectedCutoff, setSelectedCutoff] = useState(currentPeriod?.value || '');

  useEffect(() => {
    if (user) {
      fetchAttendanceData();
    }
  }, [user]);

  // Recalculate attendance data when period changes
  useEffect(() => {
    if (selectedCutoff && user) {
      fetchAttendanceData();
    }
  }, [selectedCutoff, user]);

  const createSimpleDate = (year: number, month: number, day: number) => {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let apiUrl = `/api/timesheets?`;

      if (selectedCutoff) {
        const cutoffParts = selectedCutoff.split('-');
        const year = parseInt(cutoffParts[0]);
        const month = parseInt(cutoffParts[1]);
        const startDay = parseInt(cutoffParts[2]);
        const endDay = parseInt(cutoffParts[3]);

        const startDateStr = createSimpleDate(year, month, startDay);
        const endDateStr = createSimpleDate(year, month, endDay);

        apiUrl += `&startDate=${startDateStr}&endDate=${endDateStr}`;
      }

      const response = await fetch(apiUrl, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        const timeEntries = result.data || [];

        // Map time entries to attendance record format
        const attendanceRecords = timeEntries.map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          clockInAt: entry.startTime,
          clockOutAt: entry.endTime,
          totalWorkMinutes: entry.duration ? Math.round(entry.duration * 60) : 0, // Convert hours to minutes
          status: entry.status,
          type: entry.status,
          otHours: 0,
          nightDifferential: 0,
          lateHours: 0,
          isAbsent: false,
          isIncomplete: false,
        }));

        setAttendanceRecords(attendanceRecords);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch time entries');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError('Failed to fetch attendance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string): BadgeColor => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'info';
    }
  };

  const onEditAttendance = (record: AttendanceRecord) => {
    // TODO: Implement edit functionality
    console.log('Edit attendance record:', record);
    alert(`Edit functionality for ${record.date} - Status: ${record.status}`);
  };

  // Calculate summary stats
  const totalHours = attendanceRecords.reduce((total, record) => {
    if (!record.isAbsent) {
      return total + record.totalWorkMinutes;
    }
    return total;
  }, 0) / 60; // Convert to hours

  const overtimeHours = attendanceRecords.reduce((total, record) => {
    if (!record.isAbsent && record.totalWorkMinutes > 8 * 60) {
      return total + (record.totalWorkMinutes - 8 * 60);
    }
    return total;
  }, 0) / 60; // Convert to hours

  // Round to 2 decimal places to prevent floating-point precision issues
  const roundedOvertimeHours = Math.round(overtimeHours * 100) / 100;

  const onTimeEntries = attendanceRecords.filter(record => {
    if (!record.clockInAt || record.isAbsent) return false;
    const clockInTime = new Date(`1970-01-01 ${record.clockInAt}`).getTime();
    const eightAM = new Date('1970-01-01 08:00:00').getTime();
    return clockInTime <= eightAM;
  }).length;

  const lateArrivals = attendanceRecords.filter(record => {
    if (!record.clockInAt || record.isAbsent) return false;
    const clockInTime = new Date(`1970-01-01 ${record.clockInAt}`).getTime();
    const eightAM = new Date('1970-01-01 08:00:00').getTime();
    return clockInTime > eightAM;
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Timesheet</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your time entries and attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4" />
            Filter
          </Button>
          <Button className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours This Week</p>
              <p className="text-2xl font-bold mt-2">{totalHours.toFixed(2)} hrs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Overtime Hours</p>
              <p className="text-2xl font-bold mt-2">{roundedOvertimeHours.toFixed(2)} hrs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">On Time Entries</p>
              <p className="text-2xl font-bold mt-2">{onTimeEntries} of {attendanceRecords.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</p>
              <p className="text-2xl font-bold mt-2">{lateArrivals}</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Selection */}
        <PeriodSelectionSection
          selectedCutoff={selectedCutoff}
          onCutoffChange={setSelectedCutoff}
          payrollPeriods={payrollPeriods}
        />

        {/* Attendance Records */}
        <AttendanceRecordsSection
          attendanceRecords={attendanceRecords}
          isLoading={isLoading}
          error={error}
          onEditAttendance={onEditAttendance}
          formatDuration={formatDuration}
          getStatusColor={getStatusColor}
        />
      </div>
    </div>
  );
}
