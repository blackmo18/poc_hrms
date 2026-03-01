import { DeductionController } from '@/lib/controllers';

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

export interface CreateDeduction {
  payrollId: string;
  organizationId: string;
  employeeId: string;
  type: string;
  amount: number;
}

export interface UpdateDeduction {
  type?: string;
  amount?: number;
}

export interface DeductionSummary {
  type: string;
  total: number;
  count?: number;
}

export class DeductionService {
  constructor(private controller: DeductionController) {}

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

  async create(data: CreateDeduction) {
    // Validation
    this.validateDeductionData(data);

    return await this.controller.create(data);
  }

  async update(id: string, organizationId: string, data: UpdateDeduction) {
    // Validation
    if (data.amount !== undefined && data.amount < 0) {
      throw new Error('Deduction amount cannot be negative');
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
    type: string,
    organizationId: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    return await this.controller.findByType(type, organizationId, periodStart, periodEnd);
  }

  async getDeductionTotalsByPayroll(payrollId: string, organizationId: string): Promise<DeductionSummary[]> {
    return await this.controller.getDeductionTotalsByPayroll(payrollId, organizationId);
  }

  async getDeductionTotalsByEmployee(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<DeductionSummary[]> {
    return await this.controller.getDeductionTotalsByEmployee(
      employeeId,
      organizationId,
      periodStart,
      periodEnd
    );
  }

  async bulkCreate(deductions: CreateDeduction[]) {
    // Validate all deductions
    for (const deduction of deductions) {
      this.validateDeductionData(deduction);
    }

    return await this.controller.bulkCreate(deductions);
  }

  async getGovernmentDeductions(
    payrollId: string,
    organizationId: string
  ): Promise<DeductionSummary[]> {
    const governmentTypes = ['TAX', 'SSS', 'PHILHEALTH', 'PAGIBIG'];
    const summaries: DeductionSummary[] = [];

    for (const type of governmentTypes) {
      const deductions = await this.findByType(type, organizationId);
      const payrollDeductions = deductions.filter(d => d.payrollId === payrollId);
      
      const total = payrollDeductions.reduce((sum, d) => sum + d.amount, 0);
      
      if (total > 0) {
        summaries.push({
          type,
          total,
          count: payrollDeductions.length,
        });
      }
    }

    return summaries;
  }

  async getPolicyDeductions(
    payrollId: string,
    organizationId: string
  ): Promise<DeductionSummary[]> {
    const policyTypes = ['LATE', 'UNDERTIME', 'ABSENCE'];
    const summaries: DeductionSummary[] = [];

    for (const type of policyTypes) {
      const deductions = await this.findByType(type, organizationId);
      const payrollDeductions = deductions.filter(d => d.payrollId === payrollId);
      
      const total = payrollDeductions.reduce((sum, d) => sum + d.amount, 0);
      
      if (total > 0) {
        summaries.push({
          type,
          total,
          count: payrollDeductions.length,
        });
      }
    }

    return summaries;
  }

  async getDeductionHistory(
    employeeId: string,
    organizationId: string,
    months: number = 12
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const deductions = await this.controller.findByEmployeeId(employeeId, organizationId);
    
    // Filter by date range
    const filteredDeductions = deductions.filter(d => {
      if (!d.payroll) return false;
      return d.payroll.periodStart >= startDate && d.payroll.periodEnd <= endDate;
    });

    // Group by month and type
    const monthlyData: { [key: string]: { [type: string]: number } } = {};
    
    filteredDeductions.forEach(deduction => {
      const monthKey = deduction.payroll.periodStart.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      
      if (!monthlyData[monthKey][deduction.type]) {
        monthlyData[monthKey][deduction.type] = 0;
      }
      
      monthlyData[monthKey][deduction.type] += deduction.amount;
    });

    return monthlyData;
  }

  async calculateTotalDeductions(
    payrollId: string,
    organizationId: string
  ): Promise<number> {
    const summaries = await this.getDeductionTotalsByPayroll(payrollId, organizationId);
    return summaries.reduce((total, summary) => total + summary.total, 0);
  }

  async validateDeductionLimits(
    employeeId: string,
    organizationId: string,
    newDeductions: CreateDeduction[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Get existing deductions for the period
    const existingDeductions = await this.getDeductionTotalsByEmployee(
      employeeId,
      organizationId,
      periodStart,
      periodEnd
    );

    // Group by type
    const existingByType = new Map(
      existingDeductions.map(d => [d.type, d.total])
    );

    // Check new deductions
    for (const newDeduction of newDeductions) {
      const existingTotal = existingByType.get(newDeduction.type) || 0;
      const newTotal = existingTotal + newDeduction.amount;

      // Validate specific deduction types
      switch (newDeduction.type) {
        case 'LATE':
          // Late deductions shouldn't exceed daily wage
          // This would require getting employee's daily rate
          break;
          
        case 'ABSENCE':
          // Absence deductions should match unworked days
          break;
          
        case 'LOAN':
          // Loan deductions should have remaining balance
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async exportDeductions(
    organizationId: string,
    periodStart?: Date,
    periodEnd?: Date,
    format: 'csv' | 'excel' = 'csv'
  ) {
    const deductions = await this.controller.getAll(organizationId);
    
    let filteredDeductions = deductions;
    
    if (periodStart && periodEnd) {
      filteredDeductions = deductions.filter(d => {
        if (!d.payroll) return false;
        return d.payroll.periodStart >= periodStart && d.payroll.periodEnd <= periodEnd;
      });
    }

    // Transform for export
    const exportData = filteredDeductions.map(d => ({
      EmployeeID: d.employee?.employeeId || '',
      EmployeeName: `${d.employee?.firstName || ''} ${d.employee?.lastName || ''}`,
      Department: d.employee?.department?.name || '',
      PayrollPeriod: `${d.payroll?.periodStart?.toISOString().split('T')[0] || ''} to ${d.payroll?.periodEnd?.toISOString().split('T')[0] || ''}`,
      DeductionType: d.type,
      Amount: d.amount,
      ProcessedAt: d.payroll?.processedAt?.toISOString() || '',
    }));

    return {
      data: exportData,
      format,
      filename: `deductions-${new Date().toISOString().split('T')[0]}.${format}`,
    };
  }

  private validateDeductionData(data: CreateDeduction) {
    if (!data.payrollId) {
      throw new Error('Payroll ID is required');
    }

    if (!data.organizationId) {
      throw new Error('Organization ID is required');
    }

    if (!data.employeeId) {
      throw new Error('Employee ID is required');
    }

    if (!data.type || data.type.trim().length === 0) {
      throw new Error('Deduction type is required');
    }

    if (data.amount === undefined || data.amount === null) {
      throw new Error('Deduction amount is required');
    }

    if (data.amount < 0) {
      throw new Error('Deduction amount cannot be negative');
    }

    // Validate deduction type
    const validTypes = [
      'TAX', 'SSS', 'PHILHEALTH', 'PAGIBIG',
      'LATE', 'UNDERTIME', 'ABSENCE',
      'LOAN', 'ADVANCE', 'OTHER'
    ];

    if (!validTypes.includes(data.type.toUpperCase())) {
      throw new Error(`Invalid deduction type: ${data.type}`);
    }
  }
}

let deductionService: DeductionService;

export function getDeductionService(): DeductionService {
  if (!deductionService) {
    const { prisma } = require('@/lib/db');
    const controller = new DeductionController(prisma);
    deductionService = new DeductionService(controller);
  }
  return deductionService;
}
