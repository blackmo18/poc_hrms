import { DayType, HolidayType, PayComponent, LatePolicyType } from '@prisma/client';
import { PHDeductionsService, PHDeductionResult } from './ph-deductions.service';
import { getLateDeductionPolicyService } from './late-deduction-policy.service';
import { getWorkScheduleService } from './work-schedule.service';
import { timeEntryService } from './time-entry.service';

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
  taxable_income: number;
  government_deductions: {
    tax: number;
    philhealth: number;
    sss: number;
    pagibig: number;
    total: number;
  };
  policy_deductions: {
    late: number;
    absence: number;
    total: number;
  };
  total_deductions: number;
  total_net_pay: number;
  daily_breakdown: DailyPayResult[];
}

export interface DailyPayResult {
  date: Date;
  day_type: DayType;
  holiday_type: HolidayType | null;
  regular_minutes: number;
  overtime_minutes: number;
  night_diff_minutes: number;
  late_minutes: number;
  undertime_minutes: number;
  regular_pay: number;
  overtime_pay: number;
  night_diff_pay: number;
  late_deduction: number;
  absence_deduction: number;
  total_pay: number;
}

/**
 * Payroll Calculation Service - Refactored to use Prisma Controllers
 * Handles payroll calculations for employees
 */
export class PayrollCalculationService {
  constructor(
    private phDeductionsService: PHDeductionsService
  ) {}

  /**
   * Calculate PH government deductions for an employee
   */
  async calculatePHDeductions(organizationId: string, grossPay: number): Promise<PHDeductionResult> {
    return await this.phDeductionsService.calculateAllDeductions(
      organizationId,
      grossPay
    );
  }

  /**
   * Calculate late deductions based on policies
   */
  async calculateLateDeductions(
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    dailyRate: number,
    hourlyRate: number
  ): Promise<{ totalDeduction: number; breakdown: Array<{ date: Date; minutes: number; deduction: number }> }> {
    const lateDeductionPolicyService = getLateDeductionPolicyService();
    const workScheduleService = getWorkScheduleService();
    
    // Get employee's work schedule
    const workSchedule = await workScheduleService.getByEmployeeId(employeeId);
    if (!workSchedule || !workSchedule.allowLateDeduction) {
      return { totalDeduction: 0, breakdown: [] };
    }

    // Get time entries for the period
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    );

    const breakdown: Array<{ date: Date; minutes: number; deduction: number }> = [];
    let totalDeduction = 0;
    let totalDeductionThisCutoff = 0;

    for (const entry of timeEntries) {
      if (!entry.clockOutAt) continue; // Skip incomplete entries

      // Validate time entry against schedule
      const validation = await workScheduleService.validateTimeEntry(
        workSchedule,
        entry.clockInAt,
        entry.clockOutAt
      );

      if (validation.lateMinutes > 0) {
        // Calculate deduction for tardiness
        const tardinessDeduction = await lateDeductionPolicyService.calculateDeduction(
          organizationId,
          'LATE',
          validation.lateMinutes,
          dailyRate,
          hourlyRate,
          entry.workDate
        );

        // Apply per-day maximum
        const dailyMax = workSchedule.maxDeductionPerDay;
        const actualDeduction = dailyMax ? Math.min(tardinessDeduction, dailyMax) : tardinessDeduction;

        breakdown.push({
          date: entry.workDate,
          minutes: validation.lateMinutes,
          deduction: actualDeduction
        });

        totalDeduction += actualDeduction;
        totalDeductionThisCutoff += actualDeduction;
      }

      if (validation.undertimeMinutes > 0) {
        // Calculate deduction for undertime
        const undertimeDeduction = await lateDeductionPolicyService.calculateDeduction(
          organizationId,
          'UNDERTIME',
          validation.undertimeMinutes,
          dailyRate,
          hourlyRate,
          entry.workDate
        );

        // Apply per-day maximum
        const dailyMax = workSchedule.maxDeductionPerDay;
        const actualDeduction = dailyMax ? Math.min(undertimeDeduction, dailyMax) : undertimeDeduction;

        breakdown.push({
          date: entry.workDate,
          minutes: validation.undertimeMinutes,
          deduction: actualDeduction
        });

        totalDeduction += actualDeduction;
        totalDeductionThisCutoff += actualDeduction;
      }
    }

    // Apply per-cutoff maximum
    const cutoffMax = workSchedule.maxDeductionPerMonth;
    if (cutoffMax && totalDeductionThisCutoff > cutoffMax) {
      totalDeduction = cutoffMax;
    }

    return { totalDeduction, breakdown };
  }

  /**
   * Calculate absence deductions
   */
  async calculateAbsenceDeductions(
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    dailyRate: number
  ): Promise<{ totalDeduction: number; breakdown: Array<{ date: Date; deduction: number }> }> {
    const workScheduleService = getWorkScheduleService();
    const lateDeductionPolicyService = getLateDeductionPolicyService();
    
    // Get employee's work schedule
    const workSchedule = await workScheduleService.getByEmployeeId(employeeId);
    if (!workSchedule) {
      return { totalDeduction: 0, breakdown: [] };
    }

    // Get expected work days for the period
    const expectedWorkDays = await workScheduleService.getWorkDaysForPeriod(
      workSchedule,
      periodStart,
      periodEnd
    );

    // Get actual time entries
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    );

    // Create a set of dates with time entries
    const datesWithEntries = new Set(
      timeEntries.map(entry => entry.workDate.toISOString().split('T')[0])
    );

    const breakdown: Array<{ date: Date; deduction: number }> = [];
    let totalDeduction = 0;

    // Check for absences
    for (const workDay of expectedWorkDays) {
      const dateStr = workDay.toISOString().split('T')[0];
      
      if (!datesWithEntries.has(dateStr)) {
        // Employee was absent
        // Check if there's an absence policy
        // Note: ABSENCE is not a LatePolicyType, so we'll use LATE as default
        const absencePolicy = await lateDeductionPolicyService.getPolicyByType(
          organizationId,
          'LATE',
          workDay
        );

        let deduction = dailyRate; // Default to full daily rate
        
        if (absencePolicy) {
          // Apply policy-based deduction
          switch (absencePolicy.deductionMethod) {
            case 'FIXED_AMOUNT':
              deduction = absencePolicy.fixedAmount || dailyRate;
              break;
            case 'PERCENTAGE':
              deduction = (dailyRate * (absencePolicy.percentageRate || 100)) / 100;
              break;
            case 'HOURLY_RATE':
              // For absences, typically deduct the full day
              deduction = dailyRate;
              break;
          }
        }

        breakdown.push({
          date: workDay,
          deduction
        });

        totalDeduction += deduction;
      }
    }

    return { totalDeduction, breakdown };
  }

  /**
   * Calculate complete payroll with all deductions
   */
  async calculateCompletePayroll(
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    monthlySalary: number
  ): Promise<PayrollCalculationResult> {
    const workScheduleService = getWorkScheduleService();
    
    // Get work schedule
    const workSchedule = await workScheduleService.getByEmployeeId(employeeId);
    
    // Calculate rates
    const dailyRate = workSchedule 
      ? await workScheduleService.calculateDailyRate(workSchedule, monthlySalary)
      : monthlySalary / 22; // Fallback: assume 22 working days
    
    const hourlyRate = workSchedule
      ? await workScheduleService.calculateHourlyRate(workSchedule, monthlySalary)
      : dailyRate / 8; // Fallback: 8-hour workday

    // Get time entries
    const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
      employeeId,
      periodStart,
      periodEnd
    );

    // Calculate basic pay components
    let totalRegularMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalNightDiffMinutes = 0;
    const dailyBreakdown: DailyPayResult[] = [];

    for (const entry of timeEntries) {
      if (!entry.clockOutAt) continue;

      const workMinutes = entry.totalWorkMinutes || 
        Math.floor((entry.clockOutAt.getTime() - entry.clockInAt.getTime()) / (1000 * 60));
      
      // Calculate overtime (assuming 8 hours is regular)
      const regularMinutes = Math.min(workMinutes, 480); // 8 hours = 480 minutes
      const overtimeMinutes = Math.max(0, workMinutes - 480);

      // Calculate night differential (if applicable)
      const nightDiffMinutes = workSchedule
        ? await workScheduleService.calculateNightDifferentialMinutes(
            entry.clockInAt,
            entry.clockOutAt,
            workSchedule
          )
        : 0;

      totalRegularMinutes += regularMinutes;
      totalOvertimeMinutes += overtimeMinutes;
      totalNightDiffMinutes += nightDiffMinutes;

      // Calculate daily pay
      const regularPay = (regularMinutes / 60) * hourlyRate;
      const overtimePay = (overtimeMinutes / 60) * hourlyRate * (workSchedule?.overtimeRate || 1.25);
      const nightDiffPay = (nightDiffMinutes / 60) * hourlyRate * (workSchedule?.nightDiffRate || 0.1);

      dailyBreakdown.push({
        date: entry.workDate,
        day_type: 'REGULAR' as DayType,
        holiday_type: null,
        regular_minutes: regularMinutes,
        overtime_minutes: overtimeMinutes,
        night_diff_minutes: nightDiffMinutes,
        late_minutes: 0, // Will be calculated separately
        undertime_minutes: 0, // Will be calculated separately
        regular_pay: regularPay,
        overtime_pay: overtimePay,
        night_diff_pay: nightDiffPay,
        late_deduction: 0, // Will be calculated separately
        absence_deduction: 0, // Will be calculated separately
        total_pay: regularPay + overtimePay + nightDiffPay
      });
    }

    const totalRegularPay = (totalRegularMinutes / 60) * hourlyRate;
    const totalOvertimePay = (totalOvertimeMinutes / 60) * hourlyRate * (workSchedule?.overtimeRate || 1.25);
    const totalNightDiffPay = (totalNightDiffMinutes / 60) * hourlyRate * (workSchedule?.nightDiffRate || 0.1);
    const totalGrossPay = totalRegularPay + totalOvertimePay + totalNightDiffPay;

    // Calculate deductions
    const lateDeductions = await this.calculateLateDeductions(
      organizationId,
      employeeId,
      periodStart,
      periodEnd,
      dailyRate,
      hourlyRate
    );

    const absenceDeductions = await this.calculateAbsenceDeductions(
      organizationId,
      employeeId,
      periodStart,
      periodEnd,
      dailyRate
    );

    const policyDeductionsTotal = lateDeductions.totalDeduction + absenceDeductions.totalDeduction;

    // Calculate government deductions on adjusted gross (minus policy deductions)
    const adjustedGross = Math.max(0, totalGrossPay - policyDeductionsTotal);
    const governmentDeductions = await this.calculatePHDeductions(organizationId, adjustedGross);

    const totalDeductions = governmentDeductions.totalDeductions + policyDeductionsTotal;
    const totalNetPay = totalGrossPay - totalDeductions;

    return {
      employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      total_regular_minutes: totalRegularMinutes,
      total_overtime_minutes: totalOvertimeMinutes,
      total_night_diff_minutes: totalNightDiffMinutes,
      total_regular_pay: totalRegularPay,
      total_overtime_pay: totalOvertimePay,
      total_night_diff_pay: totalNightDiffPay,
      total_gross_pay: totalGrossPay,
      taxable_income: governmentDeductions.taxableIncome,
      government_deductions: {
        tax: governmentDeductions.tax,
        philhealth: governmentDeductions.philhealth,
        sss: governmentDeductions.sss,
        pagibig: governmentDeductions.pagibig,
        total: governmentDeductions.totalDeductions
      },
      policy_deductions: {
        late: lateDeductions.totalDeduction,
        absence: absenceDeductions.totalDeduction,
        total: policyDeductionsTotal
      },
      total_deductions: totalDeductions,
      total_net_pay: totalNetPay,
      daily_breakdown: dailyBreakdown
    };
  }
}
