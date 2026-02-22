import { PayrollController } from '../controllers/payroll.controller';
import { EmployeeController } from '../controllers/employee.controller';
import { CompensationController } from '../controllers/compensation.controller';
import { PayrollCalculationService, PayrollCalculationResult } from './payroll-calculation.service';
import { prisma } from '../db';

import { DIContainer } from '../di/container';

function getDIContainer() {
  return DIContainer.getInstance();
}

let payrollCalculationService: PayrollCalculationService;
function getPayrollCalculationService(): PayrollCalculationService {
  if (!payrollCalculationService) {
    payrollCalculationService = getDIContainer().getPayrollCalculationService();
  }
  return payrollCalculationService;
}

export interface EmployeePayrollData {
  id: string | null;
  employeeId: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  position?: string;
  baseSalary: number;
  company: {
    id: string;
    name: string;
    email?: string;
    contactNumber?: string;
    address?: string;
    logo?: string;
    website?: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
    lateMinutes: number;
    undertimeMinutes: number;
  };
  earnings: {
    basicSalary: number;
    overtimePay: number;
    holidayPay: number;
    nightDifferential: number;
    totalEarnings: number;
    regularHours: number;
    overtimeHours: number;
    nightDiffHours: number;
  };
  deductions: {
    sss: number;
    philhealth: number;
    pagibig: number;
    withholdingTax: number;
    lateDeduction: number;
    absenceDeduction: number;
    totalDeductions: number;
    governmentDeductions: number;
    policyDeductions: number;
  };
  netPay: number;
  cutoffPeriod: {
    start: string;
    end: string;
  };
  organization: {
    id: string;
    name: string;
  };
  status: string;
  processedAt?: string;
  processedBy?: string;
}

export class EmployeePayrollService {
  private payrollController: PayrollController;
  private employeeController: EmployeeController;
  private compensationController: CompensationController;
  
  private get payrollCalculationService(): PayrollCalculationService {
    return getPayrollCalculationService();
  }

  constructor() {
    this.payrollController = new PayrollController(prisma);
    this.employeeController = new EmployeeController();
    this.compensationController = new CompensationController();
  }

  /**
   * Get employee payroll data for a specific period
   * Returns existing payroll if available, otherwise calculates new payroll
   */
  async getEmployeePayroll(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<EmployeePayrollData> {
    // Check if payroll already exists
    const existingPayroll = await this.payrollController.getAll(
      employeeId,
      periodStart,
      periodEnd
    );

    if (existingPayroll.length > 0) {
      const payroll = existingPayroll[0];
      return this.transformExistingPayroll(payroll, organizationId, periodStart, periodEnd);
    }

    return this.calculateNewPayroll(employeeId, organizationId, periodStart, periodEnd);
  }

  /**
   * Transform existing payroll record to the expected format
   */
  private async transformExistingPayroll(
    payroll: any,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<EmployeePayrollData> {
    // Get organization details from the payroll record, not the parameter
    const organization = await prisma.organization.findUnique({
      where: { id: payroll.organizationId }, // Use payroll's organizationId
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        address: true,
        logo: true,
        website: true,
      }
    });

    // Get stored deductions
    const storedDeductions = await prisma.deduction.findMany({
      where: { payrollId: payroll.id }
    });

    // Get stored earnings
    const storedEarnings = await prisma.payrollEarning.findMany({
      where: { payrollId: payroll.id }
    });

    // Get time entries to calculate attendance
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: payroll.employeeId,
        workDate: {
          gte: periodStart,
          lte: periodEnd,
        },
        clockOutAt: { not: null },
      },
    });

    // Calculate attendance from time entries
    const presentDays = timeEntries.length;
    const lateDays = storedDeductions.filter(d => d.type === 'LATE' && d.amount > 0).length;
    const totalLateMinutes = 0; // TODO: Calculate from work schedule validation
    const overtimeHours = Math.floor((storedEarnings.find(e => e.type === 'OVERTIME')?.hours || 0));

    // Calculate actual absent days using the service
    const actualAbsentDays = await this.payrollCalculationService.calculateActualAbsentDays(
      payroll.employeeId,
      periodStart,
      periodEnd
    );

    // Extract deduction amounts
    const taxDeduction = storedDeductions.find(d => d.type === 'TAX')?.amount || 0;
    const sssDeduction = storedDeductions.find(d => d.type === 'SSS')?.amount || 0;
    const philhealthDeduction = storedDeductions.find(d => d.type === 'PHILHEALTH')?.amount || 0;
    const pagibigDeduction = storedDeductions.find(d => d.type === 'PAGIBIG')?.amount || 0;
    const lateDeduction = storedDeductions.find(d => d.type === 'LATE')?.amount || 0;
    const absenceDeduction = storedDeductions.find(d => d.type === 'ABSENCE')?.amount || 0;

    // Extract earnings
    const basicSalary = storedEarnings.find(e => e.type === 'BASE_SALARY')?.amount || payroll.grossPay;
    const overtimePay = storedEarnings.find(e => e.type === 'OVERTIME')?.amount || 0;
    const nightDifferential = storedEarnings.find(e => e.type === 'NIGHT_DIFFERENTIAL')?.amount || 0;

    return {
      id: payroll.id,
      employeeId: payroll.employee.employeeId || payroll.employee.id, // Use employee code if available, fallback to DB ID
      firstName: payroll.employee.firstName,
      lastName: payroll.employee.lastName,
      departmentName: payroll.employee.department?.name,
      position: payroll.employee.jobTitle?.name,
      baseSalary: payroll.grossPay,
      company: {
        id: organization?.id || organizationId,
        name: organization?.name || 'Unknown Company',
        email: organization?.email || undefined,
        contactNumber: organization?.contactNumber || undefined,
        address: organization?.address || undefined,
        logo: organization?.logo || undefined,
        website: organization?.website || undefined,
      },
      attendance: {
        presentDays: presentDays,
        absentDays: actualAbsentDays,
        lateDays: lateDays,
        overtimeHours: overtimeHours,
        lateMinutes: totalLateMinutes,
        undertimeMinutes: 0, // TODO: Calculate from time entries
      },
      earnings: {
        basicSalary: basicSalary,
        overtimePay: overtimePay,
        holidayPay: 0, // TODO: Calculate from daily breakdown
        nightDifferential: nightDifferential,
        totalEarnings: payroll.grossPay,
        regularHours: Math.floor(basicSalary / (payroll.grossPay / 160)),
        overtimeHours: Math.floor((overtimePay / (payroll.grossPay / 160)) * 1.25), // Estimate
        nightDiffHours: Math.floor(nightDifferential / ((payroll.grossPay / 160) * 0.10)),
      },
      deductions: {
        sss: sssDeduction,
        philhealth: philhealthDeduction,
        pagibig: pagibigDeduction,
        withholdingTax: taxDeduction,
        lateDeduction: lateDeduction,
        absenceDeduction: absenceDeduction,
        totalDeductions: payroll.totalDeductions,
        governmentDeductions: sssDeduction + philhealthDeduction + pagibigDeduction + taxDeduction,
        policyDeductions: lateDeduction + absenceDeduction,
      },
      netPay: payroll.netPay,
      cutoffPeriod: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
      organization: {
        id: payroll.organization?.id || organizationId,
        name: payroll.organization?.name || 'Unknown',
      },
      status: payroll.status || 'PENDING',
      processedAt: payroll.processedAt?.toISOString(),
      processedBy: payroll.processedBy,
    };
  }

  /**
   * Calculate new payroll for an employee
   */
  private async calculateNewPayroll(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<EmployeePayrollData> {
    // Get employee details with compensation
    const employee = await this.employeeController.getById(employeeId);

    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    const currentCompensation = employee.compensations?.[0];
    if (!currentCompensation) {
      throw new Error(`No compensation found for employee: ${employeeId}`);
    }

    // Get organization details from employee, not the parameter
    const organization = await prisma.organization.findUnique({
      where: { id: employee.organization?.id || organizationId }, // Use employee's organization ID
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        address: true,
        logo: true,
        website: true,
      }
    });

    const calculationResult = await this.payrollCalculationService.calculateCompletePayroll(
      employee.organization?.id || organizationId,
      employeeId,
      periodStart,
      periodEnd,
      currentCompensation.baseSalary
    );

    // Calculate actual absent days using the service
    const actualAbsentDays = await this.payrollCalculationService.calculateActualAbsentDays(
      employeeId,
      periodStart,
      periodEnd
    );

    return {
      id: null, // No payroll record created yet
      employeeId: employee.employeeId || employee.id, // Use employee code if available, fallback to DB ID
      firstName: employee.firstName,
      lastName: employee.lastName,
      departmentName: employee.department?.name,
      position: employee.jobTitle?.name,
      baseSalary: currentCompensation.baseSalary,
      company: {
        id: organization?.id || organizationId,
        name: organization?.name || 'Unknown Company',
        email: organization?.email || undefined,
        contactNumber: organization?.contactNumber || undefined,
        address: organization?.address || undefined,
        logo: organization?.logo || undefined,
        website: organization?.website || undefined,
      },
      attendance: {
        presentDays: calculationResult.daily_breakdown.filter(d => d.regular_minutes > 0).length,
        absentDays: actualAbsentDays,
        lateDays: calculationResult.daily_breakdown.filter(d => d.late_minutes > 0).length,
        overtimeHours: Math.floor(calculationResult.total_overtime_minutes / 60),
        lateMinutes: calculationResult.daily_breakdown.reduce((sum, d) => sum + d.late_minutes, 0),
        undertimeMinutes: calculationResult.daily_breakdown.reduce((sum, d) => sum + d.undertime_minutes, 0),
      },
      earnings: {
        basicSalary: calculationResult.total_regular_pay,
        overtimePay: calculationResult.total_overtime_pay,
        holidayPay: 0, // TODO: Calculate from daily breakdown
        nightDifferential: calculationResult.total_night_diff_pay,
        totalEarnings: calculationResult.total_gross_pay,
        regularHours: Math.floor(calculationResult.total_regular_minutes / 60),
        overtimeHours: Math.floor(calculationResult.total_overtime_minutes / 60),
        nightDiffHours: Math.floor(calculationResult.total_night_diff_minutes / 60),
      },
      deductions: {
        sss: calculationResult.government_deductions.sss,
        philhealth: calculationResult.government_deductions.philhealth,
        pagibig: calculationResult.government_deductions.pagibig,
        withholdingTax: calculationResult.government_deductions.tax,
        lateDeduction: calculationResult.policy_deductions.late,
        absenceDeduction: calculationResult.policy_deductions.absence,
        totalDeductions: calculationResult.total_deductions,
        governmentDeductions: calculationResult.government_deductions.total,
        policyDeductions: calculationResult.policy_deductions.total,
      },
      netPay: calculationResult.total_net_pay,
      cutoffPeriod: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
      organization: {
        id: employee.organization?.id || organizationId,
        name: employee.organization?.name || 'Unknown',
      },
      status: 'PENDING',
    };
  }
}

// Export singleton instance
export const employeePayrollService = new EmployeePayrollService();
