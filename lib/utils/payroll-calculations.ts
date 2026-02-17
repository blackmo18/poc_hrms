import { timeEntryService } from '../service/time-entry.service';
import { getWorkScheduleService } from '../service/work-schedule.service';
import { PayrollCalculationService } from '../service/payroll-calculation.service';
import { getServiceContainer } from '../di/container';

/**
 * Count weekdays in a date range (excluding weekends)
 */
export function countWeekdaysInPeriod(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { count++; }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculate actual absent days for an employee
 * Returns the number of weekdays without time entries
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
  
  // Count only weekday entries as present days
  const weekdayEntries = timeEntries.filter(entry => {
    if (entry.clockOutAt === null) return false;
    
    // Check if the work date is a weekday
    const workDay = new Date(entry.workDate);
    const dayOfWeek = workDay.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
  });
  
  const presentDays = weekdayEntries.length;
  const absentDays = expectedWeekdays - presentDays;
  
  return Math.max(0, absentDays);
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
      const dailyRate = compensation.baseSalary / 22;
      const hourlyRate = dailyRate / 8;
      
      const { getLateDeductionPolicyService } = require('../service/late-deduction-policy.service');
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
 * Get payroll calculation service instance (lazy loaded)
 */
let payrollCalculationService: PayrollCalculationService;
function getPayrollCalculationService(): PayrollCalculationService {
  if (!payrollCalculationService) {
    const container = getServiceContainer();
    payrollCalculationService = container.getPayrollCalculationService();
  }
  return payrollCalculationService;
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
