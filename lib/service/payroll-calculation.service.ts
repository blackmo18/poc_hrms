import { prisma } from '@/lib/db';
import { DayType, HolidayType, PayComponent } from '@prisma/client';

export interface DailyPayResult {
  regular_minutes: number;
  regular_pay: number;
  overtime_minutes: number;
  overtime_pay: number;
  night_diff_minutes: number;
  night_diff_pay: number;
}

export interface PayrollCalculationResult {
  employeeId: string;
  period_start: Date;
  period_end: Date;
  total_regular_minutes: number;
  total_overtime_minutes: number;
  total_night_diff_minutes: number;
  total_regular_pay: number;
  total_overtime_pay: number;
  total_night_diff_pay: number;
  total_gross_pay: number;
  daily_breakdown: DailyPayResult[];
}

export class PayrollCalculationService {
  /**
   * Compute payroll for an employee within a date range
   */
  async computePayroll(employeeId: string, dateFrom: Date, dateTo: Date): Promise<PayrollCalculationResult> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        calendar: true,
        organization: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const orgId = employee.organizationId;

    // Get applicable holidays
    const holidays = await this.getApplicableHolidays(orgId, dateFrom, dateTo);

    // Get closed time entries for the period
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: employeeId,
        workDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        status: 'CLOSED',
      },
      orderBy: {
        workDate: 'asc',
      },
    });

    let totalRegularMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalNightDiffMinutes = 0;
    let totalRegularPay = 0;
    let totalOvertimePay = 0;
    let totalNightDiffPay = 0;
    const dailyBreakdown: DailyPayResult[] = [];

    for (const timeEntry of timeEntries) {
      const daily = await this.computeDailyPay(employee, timeEntry, holidays, orgId);
      dailyBreakdown.push(daily);

      totalRegularMinutes += daily.regular_minutes;
      totalOvertimeMinutes += daily.overtime_minutes;
      totalNightDiffMinutes += daily.night_diff_minutes;
      totalRegularPay += daily.regular_pay;
      totalOvertimePay += daily.overtime_pay;
      totalNightDiffPay += daily.night_diff_pay;
    }

    const totalGrossPay = totalRegularPay + totalOvertimePay + totalNightDiffPay;

    return {
      employeeId: employeeId,
      period_start: dateFrom,
      period_end: dateTo,
      total_regular_minutes: totalRegularMinutes,
      total_overtime_minutes: totalOvertimeMinutes,
      total_night_diff_minutes: totalNightDiffMinutes,
      total_regular_pay: totalRegularPay,
      total_overtime_pay: totalOvertimePay,
      total_night_diff_pay: totalNightDiffPay,
      total_gross_pay: totalGrossPay,
      daily_breakdown: dailyBreakdown,
    };
  }

  /**
   * Get applicable holidays for organization within date range
   */
  async getApplicableHolidays(orgId: string, dateFrom: Date, dateTo: Date): Promise<any[]> {
    // Get holidays associated with the organization
    const holidays = await prisma.holiday.findMany({
      where: {
        organizationId: orgId,
        OR: [
          {
            date: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
          {
            isRecurring: true,
            date: {
              // For recurring holidays, match month/day regardless of year
              gte: new Date(2000, 0, 1), // Dummy year for comparison
              lte: new Date(2000, 11, 31),
            },
          },
        ],
      },
      include: {
        holidayTemplate: true,
      },
    });

    // Filter recurring holidays to match dates in range
    const applicableHolidays = [];

    for (const holiday of holidays) {
      if (!holiday.isRecurring) {
        applicableHolidays.push(holiday);
      } else {
        // Check if any date in the range matches the recurring holiday's month/day
        let currentDate = new Date(dateFrom);
        while (currentDate <= dateTo) {
          if (
            currentDate.getMonth() === holiday.date.getMonth() &&
            currentDate.getDate() === holiday.date.getDate()
          ) {
            applicableHolidays.push({
              ...holiday,
              date: currentDate, // Use the actual date in the range
            });
            break;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return applicableHolidays;
  }

  /**
   * Resolve day type (regular, rest, holiday) and holiday type
   */
  async resolveDayType(employee: any, workDate: Date, holidays: any[]): Promise<[DayType, HolidayType | null]> {
    const holiday = await this.resolveHoliday(employee, workDate, holidays);

    if (holiday) {
      return [DayType.HOLIDAY, holiday.type];
    }

    // Check if rest day (simplified - assuming no rest day logic for now)
    // TODO: Implement proper rest day checking based on employee schedule
    const isRestDay = false;
    if (isRestDay) {
      return [DayType.REST, null];
    }

    return [DayType.REGULAR, null];
  }

  /**
   * Resolve holiday for a specific day (employee-specific override wins)
   */
  async resolveHoliday(employee: any, workDate: Date, holidays: any[]): Promise<any | null> {
    // Employee-specific override wins
    const empHoliday = await prisma.employeeHolidayAssignment.findFirst({
      where: {
        employeeId: employee.id,
        holiday: {
          date: workDate,
        },
      },
      include: {
        holiday: true,
      },
    });

    if (empHoliday) {
      return empHoliday.holiday;
    }

    // Check calendar holidays
    const calendarHoliday = holidays.find(h =>
      h.date.toDateString() === workDate.toDateString() &&
      employee.calendarId // Assuming calendar association
    );

    return calendarHoliday || null;
  }

  /**
   * Compute daily pay for a time entry
   */
  async computeDailyPay(employee: any, timeEntry: any, holidays: any[], orgId: string): Promise<DailyPayResult> {
    const [dayType, holidayType] = await this.resolveDayType(employee, timeEntry.workDate, holidays);

    // Calculate raw minutes worked
    const rawMinutes = this.calculateRawWorkedMinutes(timeEntry);

    // Get approved OT minutes
    const approvedOTMinutes = await this.getApprovedOT(employee.id, timeEntry.workDate);

    // Split into regular and OT (8 hours = 480 minutes)
    const regularMinutes = Math.min(rawMinutes, 480);
    const otMinutes = Math.min(approvedOTMinutes, Math.max(0, rawMinutes - 480));

    // Calculate night differential
    const nightMinutes = this.calculateNightDiffMinutes(timeEntry);

    // Get multipliers from payroll rules
    const regularMultiplier = await this.getPayrollRule(orgId, dayType, holidayType, PayComponent.REGULAR, timeEntry.workDate);
    const otMultiplier = await this.getPayrollRule(orgId, dayType, holidayType, PayComponent.OVERTIME, timeEntry.workDate);
    const nightMultiplier = await this.getPayrollRule(orgId, dayType, holidayType, PayComponent.NIGHT_DIFF, timeEntry.workDate);

    return {
      regular_minutes: regularMinutes,
      regular_pay: regularMinutes * regularMultiplier,
      overtime_minutes: otMinutes,
      overtime_pay: otMinutes * otMultiplier,
      night_diff_minutes: nightMinutes,
      night_diff_pay: nightMinutes * nightMultiplier,
    };
  }

  /**
   * Get payroll rule multiplier for specific conditions
   */
  async getPayrollRule(orgId: string, dayType: DayType, holidayType: HolidayType | null, component: PayComponent, workDate: Date): Promise<number> {
    const rule = await prisma.payrollRule.findFirst({
      where: {
        organizationId: orgId,
        dayType: dayType,
        appliesTo: component,
        AND: [
          {
            OR: [
              { holidayType: holidayType },
              { holidayType: null },
            ],
          },
          {
            effectiveFrom: {
              lte: workDate,
            },
          },
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: workDate } },
            ],
          },
        ],
      },
      orderBy: {
        effectiveFrom: 'desc',
        holidayType: 'desc', // Prefer specific holiday type over null
      },
    });

    if (!rule) {
      throw new Error(`Missing payroll rule configuration for org: ${orgId}, dayType: ${dayType}, component: ${component}`);
    }

    return rule.multiplier;
  }

  /**
   * Calculate raw worked minutes from time entry
   */
  calculateRawWorkedMinutes(timeEntry: any): number {
    const clockIn = new Date(timeEntry.clock_in_at);
    const clockOut = new Date(timeEntry.clock_out_at);

    // Calculate total minutes worked
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);

    // Subtract unpaid break minutes
    const unpaidBreakMinutes = this.calculateUnpaidBreakMinutes(timeEntry);

    return Math.max(0, totalMinutes - unpaidBreakMinutes);
  }

  /**
   * Calculate unpaid break minutes
   */
  calculateUnpaidBreakMinutes(timeEntry: any): number {
    // For simplicity, assume 1 hour lunch break if worked > 6 hours
    const rawWorkedMinutes = (new Date(timeEntry.clock_out_at).getTime() - new Date(timeEntry.clock_in_at).getTime()) / (1000 * 60);

    if (rawWorkedMinutes >= 360) { // 6 hours
      return 60; // 1 hour unpaid break
    }

    return 0;
  }

  /**
   * Calculate night differential minutes (10 PM - 6 AM)
   */
  calculateNightDiffMinutes(timeEntry: any): number {
    const clockIn = new Date(timeEntry.clock_in_at);
    const clockOut = new Date(timeEntry.clock_out_at);

    // Night differential period: 22:00 to 06:00 next day
    const nightStart = new Date(clockIn);
    nightStart.setHours(22, 0, 0, 0);

    const nightEnd = new Date(clockIn);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(6, 0, 0, 0);

    // Calculate overlap between work time and night period
    const workStart = clockIn;
    const workEnd = clockOut;

    const overlapStart = new Date(Math.max(workStart.getTime(), nightStart.getTime()));
    const overlapEnd = new Date(Math.min(workEnd.getTime(), nightEnd.getTime()));

    if (overlapStart < overlapEnd) {
      return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
    }

    return 0;
  }

  /**
   * Get approved overtime minutes for the day
   */
  async getApprovedOT(employeeId: string, workDate: Date): Promise<number> {
    const otRequest = await prisma.overtime.findFirst({
      where: {
        employeeId: employeeId,
        workDate: workDate,
        status: 'APPROVED',
      },
    });

    return otRequest?.approvedMinutes || 0;
  }
}

export const payrollCalculationService = new PayrollCalculationService();
