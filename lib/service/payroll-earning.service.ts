import { PayrollEarningController } from '@/lib/controllers';
import { PayrollEarningType } from '@prisma/client';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePayrollEarning {
  payrollId: string;
  organizationId: string;
  employeeId: string;
  type: PayrollEarningType;
  hours: number;
  rate: number;
  amount: number;
}

export interface UpdatePayrollEarning {
  type?: PayrollEarningType;
  hours?: number;
  rate?: number;
  amount?: number;
}

export interface EarningSummary {
  type: PayrollEarningType;
  totalHours: number;
  totalAmount: number;
  averageRate: number;
  count?: number;
}

export class PayrollEarningService {
  constructor(private controller: PayrollEarningController) {}

  async getById(id: string, organizationId?: string) {
    return await this.controller.getById(id, organizationId);
  }

  async getAll(
    organizationId?: string,
    payrollId?: string,
    employeeId?: string,
    options?: PaginationOptions
  ): Promise<PaginatedResponse<any>> {
    const result = await this.controller.getAll(organizationId, payrollId, employeeId);
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: CreatePayrollEarning) {
    // Validation
    this.validateEarningData(data);

    return await this.controller.create(data);
  }

  async update(id: string, organizationId: string, data: UpdatePayrollEarning) {
    // Validation
    if (data.hours !== undefined && data.hours < 0) {
      throw new Error('Hours cannot be negative');
    }

    if (data.rate !== undefined && data.rate < 0) {
      throw new Error('Rate cannot be negative');
    }

    if (data.amount !== undefined && data.amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    return await this.controller.update(id, organizationId, data);
  }

  async delete(id: string, organizationId: string) {
    return await this.controller.delete(id, organizationId);
  }

  async findByPayrollId(payrollId: string, organizationId?: string) {
    return await this.controller.findByPayrollId(payrollId, organizationId);
  }

  async findByEmployeeId(
    employeeId: string,
    organizationId: string,
    limit?: number
  ) {
    return await this.controller.findByEmployeeId(employeeId, organizationId, limit);
  }

  async findByType(
    type: PayrollEarningType,
    organizationId: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    return await this.controller.findByType(type, organizationId, periodStart, periodEnd);
  }

  async getEarningTotalsByPayroll(payrollId: string, organizationId: string): Promise<EarningSummary[]> {
    return await this.controller.getEarningTotalsByPayroll(payrollId, organizationId);
  }

  async getEarningTotalsByEmployee(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<EarningSummary[]> {
    return await this.controller.getEarningTotalsByEmployee(
      employeeId,
      organizationId,
      periodStart,
      periodEnd
    );
  }

  async bulkCreate(earnings: CreatePayrollEarning[]) {
    // Validate all earnings
    for (const earning of earnings) {
      this.validateEarningData(earning);
    }

    return await this.controller.bulkCreate(earnings);
  }

  async getEmployeeEarningSummary(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    return await this.controller.getEmployeeEarningSummary(
      employeeId,
      organizationId,
      periodStart,
      periodEnd
    );
  }

  async calculateOvertimeEarnings(
    employeeId: string,
    organizationId: string,
    regularHours: number,
    overtimeHours: number,
    hourlyRate: number,
    overtimeRate: number = 1.25
  ): Promise<CreatePayrollEarning[]> {
    const earnings: CreatePayrollEarning[] = [];

    // Base salary earnings
    if (regularHours > 0) {
      earnings.push({
        payrollId: '', // Will be set when creating payroll
        organizationId,
        employeeId,
        type: 'BASE_SALARY',
        hours: regularHours,
        rate: hourlyRate,
        amount: regularHours * hourlyRate,
      });
    }

    // Overtime earnings
    if (overtimeHours > 0) {
      earnings.push({
        payrollId: '', // Will be set when creating payroll
        organizationId,
        employeeId,
        type: 'OVERTIME',
        hours: overtimeHours,
        rate: hourlyRate * overtimeRate,
        amount: overtimeHours * hourlyRate * overtimeRate,
      });
    }

    return earnings;
  }

  async calculateNightDifferentialEarnings(
    employeeId: string,
    organizationId: string,
    nightDiffHours: number,
    hourlyRate: number,
    nightDiffRate: number = 0.10
  ): Promise<CreatePayrollEarning> {
    const nightDiffAmount = hourlyRate * nightDiffHours * nightDiffRate;

    return {
      payrollId: '', // Will be set when creating payroll
      organizationId,
      employeeId,
      type: 'NIGHT_DIFFERENTIAL',
      hours: nightDiffHours,
      rate: hourlyRate * nightDiffRate,
      amount: nightDiffAmount,
    };
  }

  async calculateHolidayEarnings(
    employeeId: string,
    organizationId: string,
    hoursWorked: number,
    hourlyRate: number,
    holidayType: 'REGULAR' | 'SPECIAL' | 'DOUBLE',
    isRestDay: boolean = false
  ): Promise<CreatePayrollEarning[]> {
    const earnings: CreatePayrollEarning[] = [];

    let rateMultiplier = 1;

    if (isRestDay) {
      if (holidayType === 'REGULAR') {
        rateMultiplier = 2.0; // Double holiday on rest day
      } else if (holidayType === 'SPECIAL') {
        rateMultiplier = 1.5; // Special holiday on rest day
      }
    } else {
      if (holidayType === 'REGULAR') {
        rateMultiplier = 1.3; // Regular holiday on regular day
      } else if (holidayType === 'SPECIAL') {
        rateMultiplier = 1.3; // Special holiday on regular day
      } else if (holidayType === 'DOUBLE') {
        rateMultiplier = 2.0; // Double holiday
      }
    }

    if (hoursWorked > 0) {
      earnings.push({
        payrollId: '', // Will be set when creating payroll
        organizationId,
        employeeId,
        type: 'HOLIDAY_PAY',
        hours: hoursWorked,
        rate: hourlyRate * rateMultiplier,
        amount: hoursWorked * hourlyRate * rateMultiplier,
      });
    }

    return earnings;
  }

  async calculateAllowanceEarnings(
    employeeId: string,
    organizationId: string,
    allowanceType: 'COLA' | 'TRANSPORTATION' | 'MEAL' | 'OTHER',
    amount: number
  ): Promise<CreatePayrollEarning> {
    // Since allowances don't have specific types in the enum, we'll use BASE_SALARY
    // with 0 hours and rate, and the amount as the total
    return {
      payrollId: '', // Will be set when creating payroll
      organizationId,
      employeeId,
      type: 'BASE_SALARY',
      hours: 0, // Allowances don't have hours
      rate: 0, // Allowances don't have rates
      amount,
    };
  }

  async calculateBonusEarnings(
    employeeId: string,
    organizationId: string,
    bonusType: 'PERFORMANCE' | 'CHRISTMAS' | '13TH_MONTH' | 'OTHER',
    amount: number
  ): Promise<CreatePayrollEarning> {
    // Since bonuses don't have specific types in the enum, we'll use BASE_SALARY
    // with 0 hours and rate, and the amount as the total
    return {
      payrollId: '', // Will be set when creating payroll
      organizationId,
      employeeId,
      type: 'BASE_SALARY',
      hours: 0, // Bonuses don't have hours
      rate: 0, // Bonuses don't have rates
      amount,
    };
  }

  async getTotalEarnings(
    payrollId: string,
    organizationId: string
  ): Promise<number> {
    const summaries = await this.getEarningTotalsByPayroll(payrollId, organizationId);
    return summaries.reduce((total, summary) => total + summary.totalAmount, 0);
  }

  async getEarningHistory(
    employeeId: string,
    organizationId: string,
    months: number = 12
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const earnings = await this.controller.findByEmployeeId(employeeId, organizationId);
    
    // Filter by date range
    const filteredEarnings = earnings.filter(e => {
      if (!e.payroll) return false;
      return e.payroll.periodStart >= startDate && e.payroll.periodEnd <= endDate;
    });

    // Group by month and type
    const monthlyData: { [key: string]: { [type: string]: { hours: number; amount: number } } } = {};
    
    filteredEarnings.forEach(earning => {
      const monthKey = earning.payroll.periodStart.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      
      if (!monthlyData[monthKey][earning.type]) {
        monthlyData[monthKey][earning.type] = { hours: 0, amount: 0 };
      }
      
      monthlyData[monthKey][earning.type].hours += earning.hours;
      monthlyData[monthKey][earning.type].amount += earning.amount;
    });

    return monthlyData;
  }

  async exportEarnings(
    organizationId: string,
    periodStart?: Date,
    periodEnd?: Date,
    format: 'csv' | 'excel' = 'csv'
  ) {
    const earnings = await this.controller.getAll(organizationId);
    
    let filteredEarnings = earnings;
    
    if (periodStart && periodEnd) {
      filteredEarnings = earnings.filter(e => {
        // Note: The earnings from controller don't include payroll data
        // This method needs to be updated to fetch with payroll details
        return true; // Placeholder - needs proper implementation
      });
    }

    // Transform for export
    const exportData = filteredEarnings.map(e => ({
      EmployeeID: e.employee?.employeeId || '',
      EmployeeName: `${e.employee?.firstName || ''} ${e.employee?.lastName || ''}`,
      Department: e.employee?.department?.name || '',
      PayrollPeriod: '', // Need to fetch payroll details
      EarningType: e.type,
      Hours: e.hours,
      Rate: e.rate,
      Amount: e.amount,
      ProcessedAt: '', // Need to fetch payroll details
    }));

    return {
      data: exportData,
      format,
      filename: `earnings-${new Date().toISOString().split('T')[0]}.${format}`,
    };
  }

  private validateEarningData(data: CreatePayrollEarning) {
    if (!data.payrollId) {
      throw new Error('Payroll ID is required');
    }

    if (!data.organizationId) {
      throw new Error('Organization ID is required');
    }

    if (!data.employeeId) {
      throw new Error('Employee ID is required');
    }

    if (!data.type) {
      throw new Error('Earning type is required');
    }

    if (data.hours === undefined || data.hours === null) {
      throw new Error('Hours is required');
    }

    if (data.hours < 0) {
      throw new Error('Hours cannot be negative');
    }

    if (data.rate === undefined || data.rate === null) {
      throw new Error('Rate is required');
    }

    if (data.rate < 0) {
      throw new Error('Rate cannot be negative');
    }

    if (data.amount === undefined || data.amount === null) {
      throw new Error('Amount is required');
    }

    if (data.amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    // Validate that amount equals hours * rate (with small tolerance for floating point)
    const calculatedAmount = data.hours * data.rate;
    if (Math.abs(data.amount - calculatedAmount) > 0.01) {
      // Allow some types to have custom amounts (bonuses, allowances)
      const allowableTypes = [
        'BONUS_PERFORMANCE', 'BONUS_CHRISTMAS', 'BONUS_13TH_MONTH', 'BONUS_OTHER',
        'ALLOWANCE_COLA', 'ALLOWANCE_TRANSPORTATION', 'ALLOWANCE_MEAL', 'ALLOWANCE_OTHER'
      ];
      
      if (!allowableTypes.includes(data.type)) {
        throw new Error('Amount must equal hours multiplied by rate');
      }
    }
  }
}

let payrollEarningService: PayrollEarningService;

export function getPayrollEarningService(): PayrollEarningService {
  if (!payrollEarningService) {
    const { prisma } = require('@/lib/db');
    const controller = new PayrollEarningController(prisma);
    payrollEarningService = new PayrollEarningService(controller);
  }
  return payrollEarningService;
}
