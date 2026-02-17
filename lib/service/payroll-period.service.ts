import { PayrollPeriodController } from '@/lib/controllers';

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

export interface CreatePayrollPeriod {
  startDate: Date;
  endDate: Date;
  payDate: Date;
  type?: string;
  year?: number;
  month?: number;
  periodNumber?: number;
}

export interface UpdatePayrollPeriod {
  payDate?: Date;
  status?: string;
  type?: string;
  year?: number;
  month?: number;
  periodNumber?: number;
}

export class PayrollPeriodService {
  constructor(private controller: PayrollPeriodController) {}

  async getById(organizationId: string, startDate: Date, endDate: Date) {
    return await this.controller.getById(organizationId, startDate, endDate);
  }

  async getAll(organizationId: string, options?: PaginationOptions): Promise<PaginatedResponse<any>> {
    const result = await this.controller.getAll(organizationId);
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

  async create(organizationId: string, data: CreatePayrollPeriod) {
    // Validation
    this.validatePeriodData(data);

    // Check for overlapping periods (controller does this, but we can provide better error message)
    try {
      return await this.controller.create(organizationId, data);
    } catch (error: any) {
      if (error.message.includes('overlaps')) {
        throw new Error('Payroll period overlaps with existing periods. Please check the date range.');
      }
      throw error;
    }
  }

  async update(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    data: UpdatePayrollPeriod
  ) {
    // Validate status transition
    if (data.status) {
      await this.validateStatusTransition(organizationId, startDate, endDate, data.status);
    }

    try {
      return await this.controller.update(organizationId, startDate, endDate, data);
    } catch (error: any) {
      if (error.message.includes('overlaps')) {
        throw new Error('Updated payroll period overlaps with existing periods');
      }
      throw error;
    }
  }

  async delete(organizationId: string, startDate: Date, endDate: Date) {
    try {
      return await this.controller.delete(organizationId, startDate, endDate);
    } catch (error: any) {
      if (error.message.includes('existing payrolls')) {
        throw new Error('Cannot delete payroll period with existing payroll records');
      }
      throw error;
    }
  }

  async closePeriod(organizationId: string, startDate: Date, endDate: Date) {
    try {
      return await this.controller.closePeriod(organizationId, startDate, endDate);
    } catch (error: any) {
      if (error.message.includes('already completed')) {
        throw new Error('Payroll period is already completed');
      }
      if (error.message.includes('cancelled')) {
        throw new Error('Cannot close a cancelled payroll period');
      }
      throw error;
    }
  }

  async getCurrentPeriod(organizationId: string) {
    return await this.controller.getCurrentPeriod(organizationId);
  }

  async getPeriodsByYear(organizationId: string, year: number) {
    return await this.controller.getPeriodsByYear(organizationId, year);
  }

  async getPeriodsByStatus(organizationId: string, status: string) {
    return await this.controller.getPeriodsByStatus(organizationId, status);
  }

  async generatePeriods(
    organizationId: string,
    type: 'MONTHLY' | 'SEMI_MONTHLY' | 'BI_WEEKLY' | 'WEEKLY',
    startDate: Date,
    endDate: Date,
    payDayOffset: number = 0 // Number of days after period end to pay
  ) {
    const periods = [];
    const current = new Date(startDate);

    while (current < endDate) {
      let periodStart: Date;
      let periodEnd: Date;
      let payDate: Date;
      let periodNumber: number | undefined;

      switch (type) {
        case 'MONTHLY':
          periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
          periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          periodNumber = current.getMonth() + 1;
          current.setMonth(current.getMonth() + 1);
          break;

        case 'SEMI_MONTHLY':
          if (current.getDate() <= 15) {
            periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
            periodEnd = new Date(current.getFullYear(), current.getMonth(), 15);
            periodNumber = 1;
          } else {
            periodStart = new Date(current.getFullYear(), current.getMonth(), 16);
            periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            periodNumber = 2;
            current.setMonth(current.getMonth() + 1);
          }
          if (current.getDate() <= 15) {
            current.setDate(16);
          }
          break;

        case 'BI_WEEKLY':
          periodStart = new Date(current);
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 13);
          current.setDate(current.getDate() + 14);
          break;

        case 'WEEKLY':
          const dayOfWeek = current.getDay();
          periodStart = new Date(current);
          periodStart.setDate(current.getDate() - dayOfWeek);
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 6);
          current.setDate(current.getDate() + 7);
          break;

        default:
          throw new Error(`Unsupported payroll type: ${type}`);
      }

      payDate = new Date(periodEnd);
      payDate.setDate(payDate.getDate() + payDayOffset);

      // Don't create if period goes beyond end date
      if (periodStart > endDate) break;

      try {
        const period = await this.create(organizationId, {
          startDate: periodStart,
          endDate: periodEnd,
          payDate,
          type,
          year: periodStart.getFullYear(),
          month: periodStart.getMonth() + 1,
          periodNumber,
        });
        periods.push(period);
      } catch (error: any) {
        // Skip if period already exists
        if (!error.message.includes('overlaps')) {
          throw error;
        }
      }
    }

    return periods;
  }

  async getPayrollStatistics(organizationId: string, year?: number) {
    const periods = year 
      ? await this.getPeriodsByYear(organizationId, year)
      : await this.getAll(organizationId);

    // Handle both array and PaginatedResponse
    const periodsArray = Array.isArray(periods) ? periods : periods.data;

    const stats = {
      totalPeriods: periodsArray.length,
      pendingPeriods: 0,
      processingPeriods: 0,
      completedPeriods: 0,
      cancelledPeriods: 0,
      totalPayrollsProcessed: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
    };

    periodsArray.forEach((period: any) => {
      switch (period.status) {
        case 'PENDING':
          stats.pendingPeriods++;
          break;
        case 'PROCESSING':
          stats.processingPeriods++;
          break;
        case 'COMPLETED':
          stats.completedPeriods++;
          break;
        case 'CANCELLED':
          stats.cancelledPeriods++;
          break;
      }

      if (period.payrolls) {
        stats.totalPayrollsProcessed += period.payrolls.length;
        stats.totalGrossPay += period.payrolls.reduce((sum: number, p: any) => sum + p.grossPay, 0);
        stats.totalNetPay += period.payrolls.reduce((sum: number, p: any) => sum + p.netPay, 0);
      }
    });

    return stats;
  }

  async isDateInPayrollPeriod(organizationId: string, date: Date): Promise<any> {
    const periods = await this.getAll(organizationId, { limit: 100 });
    
    for (const period of periods.data) {
      if (date >= period.startDate && date <= period.endDate) {
        return period;
      }
    }

    return null;
  }

  private validatePeriodData(data: CreatePayrollPeriod) {
    if (!data.startDate || !data.endDate || !data.payDate) {
      throw new Error('Start date, end date, and pay date are required');
    }

    if (data.startDate >= data.endDate) {
      throw new Error('Start date must be before end date');
    }

    if (data.endDate >= data.payDate) {
      throw new Error('Pay date must be after end date');
    }

    if (data.year && (data.year < 2000 || data.year > 2100)) {
      throw new Error('Invalid year');
    }

    if (data.month && (data.month < 1 || data.month > 12)) {
      throw new Error('Invalid month');
    }

    if (data.periodNumber && data.periodNumber < 1) {
      throw new Error('Period number must be greater than 0');
    }
  }

  private async validateStatusTransition(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    newStatus: string
  ) {
    const current = await this.getById(organizationId, startDate, endDate);
    
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // No transitions from completed
      'CANCELLED': ['PENDING'], // Can reactivate cancelled periods
    };

    if (!validTransitions[current.status].includes(newStatus)) {
      throw new Error(`Cannot transition from ${current.status} to ${newStatus}`);
    }
  }
}

let payrollPeriodService: PayrollPeriodService;

export function getPayrollPeriodService(): PayrollPeriodService {
  if (!payrollPeriodService) {
    const { prisma } = require('@/lib/db');
    const controller = new PayrollPeriodController(prisma);
    payrollPeriodService = new PayrollPeriodService(controller);
  }
  return payrollPeriodService;
}
