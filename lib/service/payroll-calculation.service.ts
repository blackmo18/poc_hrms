import { DayType, HolidayType, PayComponent, LatePolicyType } from '@prisma/client';
import { PHDeductionsService, PHDeductionResult } from './ph-deductions.service';
import { getLateDeductionPolicyService } from './late-deduction-policy.service';
import { getWorkScheduleService } from './work-schedule.service';
import { timeEntryService } from './time-entry.service';
import { 
  countWeekdaysInPeriod, 
  calculateActualAbsentDays as sharedCalculateActualAbsentDays,
  calculateCompletePayroll as externalCalculateCompletePayroll
} from '../utils/payroll-calculations';
import { logInfo } from '@/lib/utils/logger';
import { DIContainer } from '../di/container';
import { prisma } from '../db';

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
        
        if (tardinessDeduction > 0) {
          totalDeduction += tardinessDeduction;
          totalDeductionThisCutoff += tardinessDeduction;
          breakdown.push({
            date: new Date(entry.workDate),
            minutes: validation.lateMinutes,
            deduction: tardinessDeduction
          });
        }
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
    let totalDeduction = 0;
    const breakdown: Array<{ date: Date; deduction: number }> = [];
    
    try {
      // Get work schedule
      const workScheduleService = getWorkScheduleService();
      const schedule = await workScheduleService.getByEmployeeId(employeeId);
      if (!schedule) {
        return { totalDeduction: 0, breakdown: [] };
      }
      
      // Get time entries for the period
      const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
        employeeId,
        periodStart,
        periodEnd
      );
      
      // Get weekdays only (same as calculateActualAbsentDays)
      const expectedWeekdays = countWeekdaysInPeriod(periodStart, periodEnd);
      const datesWithEntries = new Set(
        timeEntries.map(entry => entry.workDate.toISOString().split('T')[0])
      );
      
      // Check each weekday for absence
      let currentDate = new Date(periodStart);
      while (currentDate <= periodEnd) {
        // Only check weekdays (Mon-Fri)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
          const dateStr = currentDate.toISOString().split('T')[0];
          
          if (!datesWithEntries.has(dateStr)) {
            // Check for absence policy (optional)
            // Note: There's no ABSENCE policy type, so we'll use LATE as fallback
            const lateDeductionPolicyService = getLateDeductionPolicyService();
            const absencePolicy = await lateDeductionPolicyService.getPolicyByType(
              organizationId,
              'LATE' // Using LATE as absence policies aren't supported yet
            );
            
            let deductionAmount = dailyRate; // Default to daily rate
            
            if (absencePolicy && absencePolicy.deductionMethod === 'FIXED_AMOUNT') {
              deductionAmount = absencePolicy.fixedAmount || dailyRate;
            }
            
            totalDeduction += deductionAmount;
            breakdown.push({
              date: new Date(currentDate),
              deduction: deductionAmount
            });
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error('Error calculating absence deductions:', error);
      return { totalDeduction: 0, breakdown: [] };
    }

    return { totalDeduction, breakdown };
  }

  /**
   * Calculate actual absent days based on weekdays in period
   * Now using shared utility
   */
  async calculateActualAbsentDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    return await sharedCalculateActualAbsentDays(employeeId, periodStart, periodEnd);
  }

  async calculateCompletePayroll(
    organizationId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
    monthlySalary: number
  ): Promise<PayrollCalculationResult> {
    const workScheduleService = getWorkScheduleService();
    const container = DIContainer.getInstance();
    
    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // Determine if this is semi-monthly or full month
    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const isSemiMonthly = daysInPeriod <= 16;
    
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
    
    // If there are no time entries, return basic salary without deductions
    if (timeEntries.length === 0) {
      // Calculate pro-rated basic salary for the period
      const dailyRate = workSchedule 
        ? await workScheduleService.calculateDailyRate(workSchedule, monthlySalary)
        : monthlySalary / 22; // Fallback: assume 22 working days
        
      let expectedWorkDays: number;
      let taxBase: number;
      
      if (isSemiMonthly) {
        // Semi-monthly (15-16 days)
        expectedWorkDays = daysInPeriod;
        taxBase = monthlySalary; // Use full monthly for tax bracket
      } else {
        // Full month or longer
        expectedWorkDays = Math.min(daysInPeriod, 22); // Max 22 working days
        taxBase = monthlySalary * (daysInPeriod / 30); // Pro-rate monthly for tax
      }
      
      const basicPay = dailyRate * expectedWorkDays;
      
      // Calculate government deductions on basic pay
      const phDeductionsService = container.getPHDeductionsService();
      // Pass appropriate tax base based on period length
      const governmentDeductions = await phDeductionsService.calculateAllDeductions(
        organizationId,
        basicPay,
        new Date(),
        taxBase // Use calculated tax base (monthly for semi-monthly, pro-rated for full month)
      );
      
      // For display, show monthly equivalent taxable income
      const displayTaxableIncome = isSemiMonthly 
        ? governmentDeductions.taxableIncome * 2 
        : governmentDeductions.taxableIncome;
        
      return {
        employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        total_regular_minutes: 0,
        total_overtime_minutes: 0,
        total_night_diff_minutes: 0,
        total_regular_pay: basicPay,
        total_overtime_pay: 0,
        total_night_diff_pay: 0,
        total_gross_pay: basicPay,
        taxable_income: displayTaxableIncome,
        government_deductions: {
          tax: governmentDeductions.tax,
          philhealth: governmentDeductions.philhealth,
          sss: governmentDeductions.sss,
          pagibig: governmentDeductions.pagibig,
          total: governmentDeductions.totalDeductions
        },
        policy_deductions: {
          late: 0,
          absence: 0,
          total: 0
        },
        total_deductions: governmentDeductions.totalDeductions,
        total_net_pay: basicPay - governmentDeductions.totalDeductions,
        daily_breakdown: []
      };
    }

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
      // For semi-monthly, use prorated daily rate from fixed salary
      const expectedWorkDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const fixedDailyRate = isSemiMonthly ? (monthlySalary / 2) / expectedWorkDays : dailyRate;
      const regularPay = regularMinutes > 0 ? fixedDailyRate : 0;
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

    const totalRegularPay = isSemiMonthly ? monthlySalary / 2 : (totalRegularMinutes / 60) * hourlyRate;
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

    // Calculate actual absent days for accurate reporting
    const actualAbsentDays = await this.calculateActualAbsentDays(
      employeeId,
      periodStart,
      periodEnd
    );

    // Update absence deduction to match actual absent days
    const correctedAbsenceDeduction = actualAbsentDays * dailyRate;

    const policyDeductionsTotal = lateDeductions.totalDeduction + correctedAbsenceDeduction;

    // Update daily breakdown with late deductions
    for (const lateDeduction of lateDeductions.breakdown) {
      const dayIndex = dailyBreakdown.findIndex(d => 
        d.date.toDateString() === lateDeduction.date.toDateString()
      );
      if (dayIndex !== -1) {
        dailyBreakdown[dayIndex].late_minutes = lateDeduction.minutes;
        dailyBreakdown[dayIndex].late_deduction = lateDeduction.deduction;
        dailyBreakdown[dayIndex].total_pay -= lateDeduction.deduction;
      }
    }

    // Update daily breakdown with absence deductions
    for (const absenceDeduction of absenceDeductions.breakdown) {
      const dayIndex = dailyBreakdown.findIndex(d => 
        d.date.toDateString() === absenceDeduction.date.toDateString()
      );
      if (dayIndex !== -1) {
        dailyBreakdown[dayIndex].absence_deduction = absenceDeduction.deduction;
        dailyBreakdown[dayIndex].total_pay -= absenceDeduction.deduction;
      }
    }

    // Calculate government deductions on adjusted gross (minus policy deductions)
    const adjustedGross = Math.max(0, totalGrossPay - policyDeductionsTotal);
    
    // For tax calculation, we need to determine the monthly equivalent
    // If employee has absences, tax should be based on actual compensation
    let monthlyTaxBase = monthlySalary;
    
    // Check if there are significant absences (more than 10% reduction)
    const expectedGross = monthlySalary * 0.5; // Expected semi-monthly gross
    const actualGrossRatio = adjustedGross / expectedGross;
    
    if (actualGrossRatio < 0.9) {
      // Employee has significant absences, adjust tax base
      monthlyTaxBase = monthlySalary * actualGrossRatio;
    }
    
    // For semi-monthly payroll, pass appropriate tax base
    const governmentDeductions = await this.phDeductionsService.calculateAllDeductions(
      organizationId,
      adjustedGross,
      new Date(),
      monthlyTaxBase // Use adjusted monthly rate if there are absences
    );
    
    // For display, show monthly equivalent taxable income
    const displayTaxableIncome = isSemiMonthly 
      ? governmentDeductions.taxableIncome * 2 
      : governmentDeductions.taxableIncome;

    const totalDeductions = governmentDeductions.totalDeductions + policyDeductionsTotal;
    const totalNetPay = totalGrossPay - totalDeductions;

    // Calculate total late minutes from breakdown
    const totalLateMinutes = lateDeductions.breakdown.reduce((sum, b) => sum + b.minutes, 0);

    // Create structured log entry
    const payrollLog = {
      type: 'PAYROLL_CALCULATION',
      timestamp: new Date().toISOString(),
      references: {
        organizationId,
        employeeId,
        workScheduleId: workSchedule?.id || null,
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: periodEnd.toISOString().split('T')[0]
        }
      },
      attendance: {
        presentDays: timeEntries.length,
        lateMinutes: totalLateMinutes,
        absentDays: actualAbsentDays,
        totalRegularMinutes,
        totalOvertimeMinutes,
        totalNightDiffMinutes
      },
      compensation: {
        dailyRate,
        hourlyRate,
        monthlySalary
      },
      earnings: {
        regularPay: totalRegularPay,
        overtimePay: totalOvertimePay,
        nightDiffPay: totalNightDiffPay,
        grossPay: totalGrossPay,
        netPay: totalNetPay
      },
      deductions: {
        government: {
          tax: governmentDeductions.tax,
          sss: governmentDeductions.sss,
          philhealth: governmentDeductions.philhealth,
          pagibig: governmentDeductions.pagibig,
          total: governmentDeductions.totalDeductions
        },
        policy: {
          late: lateDeductions.totalDeduction,
          absence: correctedAbsenceDeduction,
          total: policyDeductionsTotal
        },
        total: totalDeductions
      },
      policies: {
        applied: lateDeductions.breakdown.map(b => ({
          date: b.date.toISOString().split('T')[0],
          minutes: b.minutes,
          deduction: b.deduction
        }))
      },
      taxable: {
        income: displayTaxableIncome,
        isSemiMonthly,
        base: isSemiMonthly ? monthlySalary : monthlySalary * (Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) / 30)
      }
    };

    logInfo('PAYROLL_CALCULATION', payrollLog);

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
      taxable_income: displayTaxableIncome,
      government_deductions: {
        tax: governmentDeductions.tax,
        philhealth: governmentDeductions.philhealth,
        sss: governmentDeductions.sss,
        pagibig: governmentDeductions.pagibig,
        total: governmentDeductions.totalDeductions
      },
      policy_deductions: {
        late: lateDeductions.totalDeduction,
        absence: correctedAbsenceDeduction,
        total: policyDeductionsTotal
      },
      total_deductions: totalDeductions,
      total_net_pay: totalNetPay,
      daily_breakdown: dailyBreakdown
    };
  }
}
