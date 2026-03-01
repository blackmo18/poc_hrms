import { timeEntryService } from '../service/time-entry.service';
import { getWorkScheduleService } from '../service/work-schedule.service';
import { getLateDeductionPolicyService } from '../service/late-deduction-policy.service';
import { PayrollCalculationService } from '../service/payroll-calculation.service';
import { getServiceContainer } from '../di/container';
import { getLeaveRequestService } from '../service/leave-request.service';
import { logInfo } from './logger';
import { countWeekdaysInPeriod, formatDateToYYYYMMDD, getWeekdaysInPeriod } from './date-utils';

/**
 * Calculate actual absent days for an employee
 * Returns the number of weekdays without time entries AND without approved leave
 */
export async function calculateActualAbsentDays(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  // Count expected weekdays in the period
  const expectedWeekdays = countWeekdaysInPeriod(periodStart, periodEnd);
  
  // Get time entries for the period
  const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
    employeeId,
    periodStart,
    periodEnd
  );
  
  // Get approved leave requests for the period
  const leaveRequestService = getLeaveRequestService();
  const approvedLeaveRequests = await leaveRequestService.getApprovedLeaveByEmployeeAndDateRange(
    employeeId,
    periodStart,
    periodEnd
  );
  
  // Count leave days (excluding weekends)
  let leaveDays = 0;
  for (const leave of approvedLeaveRequests) {
    const current = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Count only weekdays
        leaveDays++;
      }
      current.setDate(current.getDate() + 1);
    }
  }
  
  // Count only weekday entries as present days
  const weekdayEntries = timeEntries.filter(entry => {
    if (entry.clockOutAt === null) return false;
    
    // Check if the work date is a weekday
    const workDay = new Date(entry.workDate);
    const dayOfWeek = workDay.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
  });
  
  const presentDays = weekdayEntries.length;
  
  // Get dates with time entries for quick lookup
  const datesWithEntries = new Set(
    weekdayEntries.map(entry => formatDateToYYYYMMDD(entry.workDate))
  );
  
  // Get all weekdays in the period
  const allWeekdays = getWeekdaysInPeriod(periodStart, periodEnd);
  
  // Identify absent days (weekdays without time entries)
  const absentDaysList = allWeekdays.filter(weekday => {
    const dateStr = formatDateToYYYYMMDD(weekday);
    return !datesWithEntries.has(dateStr);
  });
  
  // Exclude absent days that are covered by approved leave
  let actualAbsentDays = 0;
  for (const absentDate of absentDaysList) {
    const isCoveredByLeave = approvedLeaveRequests.some(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return absentDate >= leaveStart && absentDate <= leaveEnd;
    });
    
    if (!isCoveredByLeave) {
      actualAbsentDays++;
    }
  }
  
  
  const details =  {
    employeeId,
    calculatedAbsent: actualAbsentDays,
    periodStart,
    periodEnd,
    expectedWeekdays,
    presentDays,
    absentDaysList: absentDaysList.map(d => formatDateToYYYYMMDD(d)),
    approvedLeaveRequests
  }
  logInfo('CALCULATE_ABSENT_DAY', details)
  return Math.max(0, actualAbsentDays);
}

/**
 * Calculate late minutes and instances for an employee
 * Returns total late minutes and number of late instances
 */
export async function calculateLateMetrics(
  employeeId: string,
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
  compensation: any
): Promise<{ totalMinutes: number; instances: number }> {
  const workScheduleService = getWorkScheduleService();
  const schedule = await workScheduleService.getByEmployeeId(employeeId);
  
  if (!schedule || !schedule.allowLateDeduction) {
    return { totalMinutes: 0, instances: 0 };
  }
  
  const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
    employeeId,
    periodStart,
    periodEnd
  );
  
  let totalMinutes = 0;
  let instances = 0;
  
  for (const entry of timeEntries) {
    if (!entry.clockOutAt) continue;
    
    const validation = await workScheduleService.validateTimeEntry(
      schedule,
      entry.clockInAt,
      entry.clockOutAt
    );
    
    if (validation.lateMinutes > 0) {
      // Check against late deduction policy
      const daysPerMonth = parseInt(process.env.PAYROLL_DAYS_PER_MONTH || '22');
      const hoursPerDay = parseInt(process.env.PAYROLL_HOURS_PER_DAY || '8');
      const dailyRate = compensation.baseSalary / daysPerMonth;
      const hourlyRate = dailyRate / hoursPerDay;
      
      const lateDeductionPolicyService = getLateDeductionPolicyService();
      
      const deductionAmount = await lateDeductionPolicyService.calculateDeduction(
        organizationId,
        'LATE',
        validation.lateMinutes,
        dailyRate,
        hourlyRate,
        entry.workDate
      );
      // Only count if there's an actual deduction
      if (deductionAmount > 0) {
        totalMinutes += validation.lateMinutes;
        instances++;
      }
    }
  }
  
  return { totalMinutes, instances };
}

/**
 * Calculate undertime minutes for an employee
 */
export async function calculateUndertimeMinutes(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const workScheduleService = getWorkScheduleService();
  const schedule = await workScheduleService.getByEmployeeId(employeeId);
  
  if (!schedule) {
    return 0;
  }
  
  const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
    employeeId,
    periodStart,
    periodEnd
  );
  
  let totalUndertimeMinutes = 0;
  
  for (const entry of timeEntries) {
    if (!entry.clockOutAt) continue;
    
    const validation = await workScheduleService.validateTimeEntry(
      schedule,
      entry.clockInAt,
      entry.clockOutAt
    );
    
    totalUndertimeMinutes += validation.undertimeMinutes;
  }
  
  return totalUndertimeMinutes;
}

/**
 * Get complete payroll metrics for an employee
 * Combines all calculations in one call
 */
export async function getEmployeePayrollMetrics(
  employeeId: string,
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
  compensation: any
): Promise<{
  absentDays: number;
  lateMinutes: number;
  lateInstances: number;
  undertimeMinutes: number;
  presentDays: number;
  expectedWeekdays: number;
}> {
  // Get all metrics
  const [absentDays, lateMetrics, undertimeMinutes] = await Promise.all([
    calculateActualAbsentDays(employeeId, periodStart, periodEnd),
    calculateLateMetrics(employeeId, organizationId, periodStart, periodEnd, compensation),
    calculateUndertimeMinutes(employeeId, periodStart, periodEnd)
  ]);
  
  // Calculate present days
  const expectedWeekdays = countWeekdaysInPeriod(periodStart, periodEnd);
  const presentDays = expectedWeekdays - absentDays;
  
  return {
    absentDays,
    lateMinutes: lateMetrics.totalMinutes,
    lateInstances: lateMetrics.instances,
    undertimeMinutes,
    presentDays,
    expectedWeekdays
  };
}

/**
 * Get payroll calculation service instance
 */
function getPayrollCalculationService(): PayrollCalculationService {
  return getServiceContainer().getPayrollCalculationService();
}

/**
 * Calculate complete payroll with all deductions and earnings
 */
export async function calculateCompletePayroll(
  employeeId: string,
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
  baseSalary: number
) {
  const service = getPayrollCalculationService();
  return await service.calculateCompletePayroll(
    organizationId,
    employeeId,
    periodStart,
    periodEnd,
    baseSalary
  );
}
