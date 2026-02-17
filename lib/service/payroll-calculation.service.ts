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
import { DIContainer } from '../di/container';

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
    console.log(`[DEBUG] Work schedule for late deductions:`, workSchedule ? {
      allowLateDeduction: workSchedule.allowLateDeduction,
      gracePeriodMinutes: workSchedule.gracePeriodMinutes,
      defaultStart: workSchedule.defaultStart
    } : 'No work schedule found');
    
    if (!workSchedule || !workSchedule.allowLateDeduction) {
      console.log(`[DEBUG] Late deductions not allowed - no schedule or disabled`);
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
      
      console.log(`[DEBUG] Processing time entry for ${entry.workDate}:`, {
        clockIn: entry.clockInAt,
        clockOut: entry.clockOutAt,
        workDate: entry.workDate
      });

      // Validate time entry against schedule
      const validation = await workScheduleService.validateTimeEntry(
        workSchedule,
        entry.clockInAt,
        entry.clockOutAt
      );
      
      console.log(`[DEBUG] Validation result for ${entry.workDate}:`, {
        lateMinutes: validation.lateMinutes,
        isValid: validation.isValid,
        violations: validation.violations
      });

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
        
        console.log(`[DEBUG] Tardiness deduction for ${entry.workDate}:`, {
          lateMinutes: validation.lateMinutes,
          calculatedDeduction: tardinessDeduction,
          dailyMax: workSchedule.maxDeductionPerDay
        });

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
    console.log(`[DEBUG] Calculating absence deductions for employee ${employeeId}`);
    console.log(`[DEBUG] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
    console.log(`[DEBUG] Daily rate: ₱${dailyRate}`);
    
    let totalDeduction = 0;
    const breakdown: Array<{ date: Date; deduction: number }> = [];
    
    try {
      // Get work schedule
      const workScheduleService = getWorkScheduleService();
      const schedule = await workScheduleService.getByEmployeeId(employeeId);
      if (!schedule) {
        console.log(`[DEBUG] No work schedule found for employee ${employeeId}`);
        return { totalDeduction: 0, breakdown: [] };
      }
      
      console.log(`[DEBUG] Work schedule found: ${schedule.defaultStart} - ${schedule.defaultEnd}`);
      
      // Get time entries for the period
      const timeEntries = await timeEntryService.getByEmployeeAndDateRange(
        employeeId,
        periodStart,
        periodEnd
      );
      
      // Get weekdays only (same as calculateActualAbsentDays)
      const expectedWeekdays = countWeekdaysInPeriod(periodStart, periodEnd);
      console.log(`[DEBUG] Expected weekdays: ${expectedWeekdays}`);
      
      // Create a set of dates with time entries
      const datesWithEntries = new Set(
        timeEntries.map(entry => entry.workDate.toISOString().split('T')[0])
      );
      console.log(`[DEBUG] Time entries found: ${timeEntries.length}`);
      
      // Check each weekday for absence
      let currentDate = new Date(periodStart);
      while (currentDate <= periodEnd) {
        // Only check weekdays (Mon-Fri)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
          const dateStr = currentDate.toISOString().split('T')[0];
          
          if (!datesWithEntries.has(dateStr)) {
            console.log(`[DEBUG] Absence detected on ${dateStr}`);
            
            // Check for absence policy (optional)
            // Note: There's no ABSENCE policy type, so we'll use LATE as fallback
            const lateDeductionPolicyService = getLateDeductionPolicyService();
            const absencePolicy = await lateDeductionPolicyService.getPolicyByType(
              organizationId,
              'LATE' // Using LATE as absence policies aren't supported yet
            );
            
            console.log(`[DEBUG] Absence policy found:`, absencePolicy);
            
            let deductionAmount = dailyRate; // Default to daily rate
            
            if (absencePolicy && absencePolicy.deductionMethod === 'FIXED_AMOUNT') {
              deductionAmount = absencePolicy.fixedAmount || dailyRate;
            } else if (absencePolicy && absencePolicy.deductionMethod === 'PERCENTAGE') {
              deductionAmount = dailyRate * (absencePolicy.percentageRate || 1);
            }
            
            totalDeduction += deductionAmount;
            breakdown.push({
              date: new Date(currentDate),
              deduction: deductionAmount
            });
            
            console.log(`[DEBUG] Added deduction: ₱${deductionAmount}, Total so far: ₱${totalDeduction}`);
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error(`[DEBUG] Error calculating absence deductions:`, error);
      return { totalDeduction: 0, breakdown: [] };
    }

    console.log(`[DEBUG] Final absence deduction total: ₱${totalDeduction}`);
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
    console.log(`[DEBUG] calculateCompletePayroll called for employee: ${employeeId}`);
    console.log(`[DEBUG] Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
    console.log(`[DEBUG] Monthly salary: ${monthlySalary}`);
    
    const workScheduleService = getWorkScheduleService();
    const container = DIContainer.getInstance();
    
    // Get work schedule
    const workSchedule = await workScheduleService.getByEmployeeId(employeeId);
    console.log(`[DEBUG] Work schedule found:`, workSchedule ? 'Yes' : 'No');
    
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
    
    console.log(`[DEBUG] Time entries found: ${timeEntries.length}`);
    if (timeEntries.length > 0) {
      console.log(`[DEBUG] First time entry:`, {
        workDate: timeEntries[0].workDate,
        clockInAt: timeEntries[0].clockInAt,
        clockOutAt: timeEntries[0].clockOutAt,
        totalWorkMinutes: timeEntries[0].totalWorkMinutes
      });
    }
    
    // If there are no time entries, return basic salary without deductions
    if (timeEntries.length === 0) {
      console.log(`[DEBUG] No time entries found - returning basic salary`);
      // Calculate pro-rated basic salary for the period
      const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRate = workSchedule 
        ? await workScheduleService.calculateDailyRate(workSchedule, monthlySalary)
        : monthlySalary / 22; // Fallback: assume 22 working days
        
      // For semi-monthly, typically 15-16 days
      const expectedWorkDays = Math.min(daysInPeriod, 16);
      const basicPay = dailyRate * expectedWorkDays;
      
      // Calculate government deductions on basic pay
      const phDeductionsService = container.getPHDeductionsService();
      console.log(`[DEBUG] Calculating government deductions for basic pay: ${basicPay}`);
      const governmentDeductions = await phDeductionsService.calculateAllDeductions(
        organizationId,
        basicPay
      );
      console.log(`[DEBUG] Government deductions result:`, governmentDeductions);
        
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
        taxable_income: governmentDeductions.taxableIncome,
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
    
    console.log(`[DEBUG] Late deductions result:`, {
      totalDeduction: lateDeductions.totalDeduction,
      breakdownCount: lateDeductions.breakdown.length,
      breakdown: lateDeductions.breakdown
    });

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
        absence: correctedAbsenceDeduction,
        total: policyDeductionsTotal
      },
      total_deductions: totalDeductions,
      total_net_pay: totalNetPay,
      daily_breakdown: dailyBreakdown
    };
  }
}
