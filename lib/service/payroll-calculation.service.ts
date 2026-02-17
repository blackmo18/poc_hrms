import { DayType, HolidayType, PayComponent } from '@prisma/client';
import { PHDeductionsService, PHDeductionResult } from './ph-deductions.service';

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
  regular_pay: number;
  overtime_pay: number;
  night_diff_pay: number;
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
}
