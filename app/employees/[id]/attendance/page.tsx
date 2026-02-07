'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import EmployeeDetailsSection from '@/components/employees/attendance/EmployeeDetailsSection';
import PeriodSelectionSection from '@/components/employees/attendance/PeriodSelectionSection';
import AttendanceRecordsSection from '@/components/employees/attendance/AttendanceRecordsSection';
import { usePayrollPeriods as usePayrollPeriodsHook } from '@/hooks/usePayrollPeriods';
import { useAuth } from '@/components/providers/auth-provider';
import { ProtectedRoute } from '@/components/protected-route';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import PageMeta from '@/components/common/PageMeta';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Badge, { BadgeColor } from '@/components/ui/badge/Badge';

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

interface EmployeeInfo {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  organization: string;
  position?: string;
}

export default function EmployeeAttendancePage() {
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Period selection state
  const { periods: payrollPeriods, currentPeriod } = usePayrollPeriodsHook({
    lookbackPeriods: 2, // Include 2 periods back
    lookaheadPeriods: 2, // Include 2 periods forward
    includeCurrentPeriod: true // Include current period
  });

  const [selectedCutoff, setSelectedCutoff] = useState(currentPeriod?.value || '');

  const { user } = useAuth();

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
      fetchAttendanceData();
    }
  }, [employeeId]);

  // Recalculate attendance data when period changes
  useEffect(() => {
    if (selectedCutoff && employeeId) {
      fetchAttendanceData();
    }
  }, [selectedCutoff, employeeId]);

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        const employeeData = result.data || result; // Handle both wrapped and direct responses

        console.log('Employee data:', employeeData); // Debug log

        setEmployee({
          id: employeeData.id,
          employeeId: employeeData.employeeId || employeeData.custom_id || employeeData.employee_id || employeeData.id,
          name: employeeData.firstName && employeeData.lastName
            ? `${employeeData.firstName} ${employeeData.lastName}`
            : employeeData.name || 'Unknown Employee',
          department: employeeData.department?.name || 'Unknown',
          organization: employeeData.organization?.name || 'Unknown',
          position: employeeData.jobTitle?.name || employeeData.position || 'Not specified',
        });
      } else {
        console.error('Failed to fetch employee data:', response.status, response.statusText);
        // Set default employee data so the page doesn't break
        setEmployee({
          id: employeeId,
          employeeId: employeeId,
          name: 'Employee',
          department: 'Unknown',
          organization: 'Unknown',
          position: 'Not specified',
        });
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      // Set default employee data so the page doesn't break
      setEmployee({
        id: employeeId,
        employeeId: employeeId,
        name: 'Employee',
        department: 'Unknown',
        organization: 'Unknown',
        position: 'Not specified',
      });
    }
  };

  const createSimpleDate = (year: number, month: number, day: number) => {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get attendance records for the selected cutoff period
      let apiUrl = `/api/timesheets?employeeId=${employeeId}`;
      
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

      console.log('api-url', apiUrl)
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
          isAbsent: false,
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

  const generateCutoffPeriodDates = (): string[] => {
    let startDate: Date;
    let endDate: Date;
    const dates: string[] = [];

    if (selectedCutoff) {
      // Parse the selected cutoff to get start and end dates
      // Format: year-month-startDay-endDay (e.g., "2026-2-1-15")
      const cutoffParts = selectedCutoff.split('-');
      const year = parseInt(cutoffParts[0]);
      const month = parseInt(cutoffParts[1]) 
      const startDay = parseInt(cutoffParts[2]);
      const endDay = parseInt(cutoffParts[3]);

      // Handle periods that span across months (e.g., when endDay < startDay)
      const startMonth = month;
      let endMonth = endDay < startDay ? month + 1 : month;

      // Adjust for periods that start on the 31st and span months
      let adjustedStartMonth = startMonth;
      let adjustedStartDay = startDay;
      if (startDay === 31 && endMonth === startMonth + 1) {
        adjustedStartMonth = startMonth + 1;
        adjustedStartDay = 1;
      }

      // Generate dates as strings to avoid timezone issues
      let currentYear = year;
      let currentMonth = adjustedStartMonth;
      let currentDay = adjustedStartDay;
      
      const targetEndYear = year;
      const targetEndMonth = endMonth;
      const targetEndDay = endDay;
      
      while (true) {
        const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;
        dates.push(dateStr);
        
        // Check if we've reached the end date
        if (currentYear === targetEndYear && currentMonth === targetEndMonth && currentDay === targetEndDay) {
          break;
        }
        
        // Increment day
        currentDay++;
        
        // Handle month transitions
        const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
        if (currentDay > daysInCurrentMonth) {
          currentDay = 1;
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }
      }
    } else {
      // Fallback to current cutoff period
      const today = new Date();
      const currentDate = today.getDate();

      if (currentDate <= 15) {
        // First half of month: 1st to 15th
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 15);
      } else {
        // Second half of month: 16th to end of month
        startDate = new Date(today.getFullYear(), today.getMonth(), 16);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      const current = new Date(startDate);

      while (current <= endDate) {
        // Include all dates in the period (not just weekdays)
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    return dates;
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    // TODO: Implement edit functionality - could open modal or navigate to edit page
    console.log('Edit attendance record:', record);
    alert(`Edit functionality for ${record.date} - Status: ${record.status}`);
  };

  const calculateTotalWorkedHours = (records: AttendanceRecord[]): string => {
    const totalMinutes = records.reduce((total, record) => {
      // Only count actual worked time, not absent records
      if (!record.isAbsent) {
        return total + record.totalWorkMinutes;
      }
      return total;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
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

  return (
    <ProtectedRoute requiredRoles={ADMINSTRATIVE_ROLES} fallbackPath="/dashboard">
      <PageMeta title={`Employee Attendance - ${employee?.name || 'Loading...'}`} description='View employee attendance records' />
      <PageBreadcrumb pageTitle={`Employee Attendance - ${employee?.name || 'Loading...'}`} />

      <div className="space-y-6">
        {/* Employee Information */}
        <EmployeeDetailsSection
          employee={employee}
          attendanceRecords={attendanceRecords}
          calculateTotalWorkedHours={calculateTotalWorkedHours}
        />

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
          onEditAttendance={handleEditAttendance}
          formatDuration={formatDuration}
          getStatusColor={getStatusColor}
        />
      </div>
    </ProtectedRoute>
  );
}
