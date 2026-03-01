import { payrollController } from '@/lib/controllers/payroll.controller';
import { CreatePayroll, UpdatePayroll } from '@/lib/models/payroll';
import { Payroll, PayrollEarning, Deduction, PayrollLog, PayrollStatus } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { getPayrollEarningService } from './payroll-earning.service';
import { getDeductionService } from './deduction.service';
import { PayrollLogService } from './payroll-log.service';
import { getServiceContainer } from '@/lib/di/container';
import { logInfo, logError, logWarn } from '@/lib/utils/logger';

export interface PayrollGenerationInput {
  employeeId: string;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface PayrollGenerationResult {
  payroll: Payroll;
  earnings: PayrollEarning[];
  deductions: Deduction[];
  log?: any; // Made optional since logAction returns void
}

export class PayrollService {
  async getById(id: string): Promise<Payroll | null> {
    return await payrollController.getById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<Payroll[]> {
    const result = await payrollController.getAll();
    return result.filter(p => p.employeeId === employeeId);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<Payroll>> {
    const result = await payrollController.getAll();
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

  async create(data: CreatePayroll): Promise<Payroll> {
    return await payrollController.create(data);
  }

  async update(id: string, data: UpdatePayroll): Promise<Payroll> {
    return await payrollController.update(id, data);
  }

  async delete(id: string): Promise<Payroll> {
    return await payrollController.delete(id);
  }

  /**
   * Generate payroll for an employee for a given period
   * Creates payroll record, earnings, deductions, and logs the generation
   */
  async generatePayroll(input: PayrollGenerationInput, userId: string): Promise<PayrollGenerationResult> {
    const { employeeId, organizationId, periodStart, periodEnd } = input;

    // Log critical flow start
    logInfo('Starting payroll generation', {
      references: {
        organizationId,
        employeeId,
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: periodEnd.toISOString().split('T')[0]
        }
      },
      userId,
      status: 'STARTED'
    });

    // Check if payroll already exists for this period
    const existingPayroll = await payrollController.getAll().then(payrolls =>
      payrolls.find(p =>
        p.employeeId === employeeId &&
        p.periodStart.getTime() === periodStart.getTime() &&
        p.periodEnd.getTime() === periodEnd.getTime() &&
        p.status !== PayrollStatus.VOIDED
      )
    );

    if (existingPayroll) {
      logInfo('Returning existing payroll', {
        references: {
          organizationId,
          employeeId,
          existingPayrollId: existingPayroll.id,
          period: {
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          }
        },
        status: 'RETURNING_EXISTING'
      });

      // Get existing earnings and deductions
      const payrollEarningService = getPayrollEarningService();
      const deductionService = getDeductionService();
      const earnings = await payrollEarningService.getAll(existingPayroll.organizationId, existingPayroll.id);
      const deductions = await deductionService.getAll(existingPayroll.organizationId, existingPayroll.id);

      return {
        payroll: existingPayroll,
        earnings: earnings.data,
        deductions: deductions.data,
        log: undefined
      };
    }

    // Get employee and compensation BEFORE calculation
    const employeeController = (await import('@/lib/controllers/employee.controller')).employeeController;
    const employee = await employeeController.getById(employeeId);
    if (!employee) {
      console.log(`[PAYROLL_GENERATION] Employee not found`, JSON.stringify({
        timestamp: new Date().toISOString(),
        employeeId,
        organizationId,
        status: 'EMPLOYEE_NOT_FOUND'
      }));
      throw new Error('Employee not found');
    }

    // Validate that employee belongs to the organization
    if (employee.organizationId !== organizationId) {
      logError('Organization mismatch', null, {
        employeeId,
        employeeOrganizationId: employee.organizationId,
        requestedOrganizationId: organizationId,
        status: 'ORGANIZATION_MISMATCH'
      });
      throw new Error('Employee does not belong to this organization');
    }

    // Get the employee's compensation
    const compensation = employee.compensations?.[0];
    const monthlySalary = compensation?.baseSalary || 0;

    logWarn('Using employee salary', {
      employeeId,
      monthlySalary,
      hasCompensation: !!compensation,
      compensationId: compensation?.id
    });

    // Calculate payroll using the calculation service with actual salary
    const container = getServiceContainer();
    const payrollCalculationService = container.getPayrollCalculationService();
    const calculationResult = await payrollCalculationService.calculateCompletePayroll(
      organizationId,
      employeeId,
      periodStart,
      periodEnd,
      monthlySalary
    );

    // Create payroll record
    const payrollData: CreatePayroll = {
      employeeId,
      organizationId,
      departmentId: employee.departmentId,
      periodStart,
      periodEnd,
      grossPay: calculationResult.total_gross_pay,
      netPay: calculationResult.total_net_pay,
      taxableIncome: calculationResult.taxable_income,
      taxDeduction: calculationResult.government_deductions.tax,
      philhealthDeduction: calculationResult.government_deductions.philhealth,
      sssDeduction: calculationResult.government_deductions.sss,
      pagibigDeduction: calculationResult.government_deductions.pagibig,
      totalDeductions: calculationResult.total_deductions,
      status: PayrollStatus.COMPUTED
    };

    const payroll = await payrollController.create(payrollData);

    // Use the actual payroll ID returned from creation
    const payrollId = payroll.id;

    // Create payroll earnings
    const earnings: PayrollEarning[] = [];
    const payrollEarningService = getPayrollEarningService();

    // Regular pay earning
    earnings.push(await payrollEarningService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'BASE_SALARY',
      hours: calculationResult.total_regular_minutes / 60, // Convert to hours
      rate: calculationResult.total_regular_pay / (calculationResult.total_regular_minutes / 60), // Hourly rate
      amount: calculationResult.total_regular_pay
    }));

    // Overtime earning (if any)
    if (calculationResult.total_overtime_pay > 0) {
      earnings.push(await payrollEarningService.create({
        payrollId,
        organizationId,
        employeeId,
        type: 'OVERTIME',
        hours: calculationResult.total_overtime_minutes / 60,
        rate: (calculationResult.total_overtime_pay / (calculationResult.total_overtime_minutes / 60)),
        amount: calculationResult.total_overtime_pay
      }));
    }

    // Night differential earning (if any)
    if (calculationResult.total_night_diff_pay > 0) {
      earnings.push(await payrollEarningService.create({
        payrollId,
        organizationId,
        employeeId,
        type: 'NIGHT_DIFFERENTIAL',
        hours: calculationResult.total_night_diff_minutes / 60,
        rate: (calculationResult.total_night_diff_pay / (calculationResult.total_night_diff_minutes / 60)),
        amount: calculationResult.total_night_diff_pay
      }));
    }

    // Create deductions
    const deductions: Deduction[] = [];
    const deductionService = getDeductionService();

    // Government deductions
    deductions.push(await deductionService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'TAX',
      amount: calculationResult.government_deductions.tax
    }));

    deductions.push(await deductionService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'PHILHEALTH',
      amount: calculationResult.government_deductions.philhealth
    }));

    deductions.push(await deductionService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'SSS',
      amount: calculationResult.government_deductions.sss
    }));

    deductions.push(await deductionService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'PAGIBIG',
      amount: calculationResult.government_deductions.pagibig
    }));

    // Policy deductions (late/absence)
    deductions.push(await deductionService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'LATE',
      amount: calculationResult.policy_deductions.late
    }));

    deductions.push(await deductionService.create({
      payrollId,
      organizationId,
      employeeId,
      type: 'ABSENCE',
      amount: calculationResult.policy_deductions.absence
    }));

    // Create payroll log
    const payrollLogService = PayrollLogService.getInstance();
    await payrollLogService.logAction({
      payrollId,
      action: 'GENERATED',
      previousStatus: null,
      newStatus: 'COMPUTED',
      reason: 'Payroll generated from time entries',
      userId
    });

    // Log critical flow completion
    logInfo('PAYROLL_GENERATION', {
      timestamp: new Date().toISOString(),
      references: {
        organizationId,
        employeeId,
        payrollId,
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: periodEnd.toISOString().split('T')[0]
        }
      },
      summary: {
        grossPay: payrollData.grossPay,
        netPay: payrollData.netPay,
        totalDeductions: payrollData.totalDeductions,
        earningsCount: earnings.length,
        deductionsCount: deductions.length
      },
      status: 'COMPLETED'
    });

    return {
      payroll,
      earnings,
      deductions,
      log: undefined // logAction returns void, so no log object to return
    };
  }

  /**
   * Approve payroll - changes status from COMPUTED to APPROVED
   */
  async approvePayroll(payrollId: string, userId: string, reason?: string): Promise<Payroll> {
    const payroll = await this.getById(payrollId);
    if (!payroll) {
      logError('Payroll not found', {
        timestamp: new Date().toISOString(),
        references: {
          payrollId,
          userId
        },
        status: 'PAYROLL_NOT_FOUND'
      });
      throw new Error('Payroll not found');
    }

    if (payroll.status !== PayrollStatus.COMPUTED) {
      logError('Invalid status for approval', {
        timestamp: new Date().toISOString(),
        payrollId,
        userId,
        currentStatus: payroll.status,
        requiredStatus: 'COMPUTED',
        status: 'INVALID_STATUS'
      });
      throw new Error(`Cannot approve payroll with status ${payroll.status}`);
    }

    // Log approval decision
    logInfo('PAYROLL_APPROVAL', {
      timestamp: new Date().toISOString(),
      references: {
        payrollId,
        employeeId: payroll.employeeId,
        organizationId: payroll.organizationId,
        period: {
          start: payroll.periodStart.toISOString().split('T')[0],
          end: payroll.periodEnd.toISOString().split('T')[0]
        }
      },
      userId,
      reason: reason || 'Approved for processing',
      status: 'APPROVING'
    });

    const updatedPayroll = await payrollController.update(payrollId, {
      status: PayrollStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: userId
    });

    // Log the approval
    const payrollLogService = PayrollLogService.getInstance();
    await payrollLogService.logAction({
      payrollId,
      action: 'APPROVED',
      previousStatus: payroll.status,
      newStatus: 'APPROVED',
      reason: reason || 'Payroll approved for release',
      userId
    });

    logInfo('PAYROLL_APPROVAL', {
      timestamp: new Date().toISOString(),
      payrollId,
      userId,
      newStatus: 'APPROVED',
      status: 'COMPLETED'
    });

    return updatedPayroll;
  }

  /**
   * Release payroll - changes status from APPROVED to RELEASED
   */
  async releasePayroll(payrollId: string, userId: string, reason?: string): Promise<Payroll> {
    const payroll = await this.getById(payrollId);
    if (!payroll) {
      logError('Payroll not found', {
        timestamp: new Date().toISOString(),
        references: {
          payrollId,
          userId
        },
        status: 'PAYROLL_NOT_FOUND'
      });
      throw new Error('Payroll not found');
    }

    if (payroll.status !== PayrollStatus.APPROVED) {
      logError('Invalid status for release', {
        timestamp: new Date().toISOString(),
        payrollId,
        userId,
        currentStatus: payroll.status,
        requiredStatus: 'APPROVED',
        status: 'INVALID_STATUS'
      });
      throw new Error(`Cannot release payroll with status ${payroll.status}`);
    }

    // Log release decision
    logInfo('PAYROLL_RELEASE', {
      timestamp: new Date().toISOString(),
      references: {
        payrollId,
        employeeId: payroll.employeeId,
        period: {
          start: payroll.periodStart.toISOString().split('T')[0],
          end: payroll.periodEnd.toISOString().split('T')[0]
        }
      },
      userId,
      reason: reason || 'Released to employee',
      status: 'RELEASING'
    });

    const updatedPayroll = await payrollController.update(payrollId, {
      status: PayrollStatus.RELEASED,
      releasedAt: new Date(),
      releasedBy: userId
    });

    // Log the release
    const payrollLogService = PayrollLogService.getInstance();
    await payrollLogService.logAction({
      payrollId,
      action: 'RELEASED',
      previousStatus: payroll.status,
      newStatus: 'RELEASED',
      reason: reason || 'Payroll released to employee',
      userId
    });

    logInfo('PAYROLL_RELEASE', {
      timestamp: new Date().toISOString(),
      payrollId,
      userId,
      newStatus: 'RELEASED',
      status: 'COMPLETED'
    });

    return updatedPayroll;
  }

  /**
   * Void payroll - changes status to VOIDED
   */
  async voidPayroll(payrollId: string, userId: string, reason: string): Promise<Payroll> {
    const payroll = await this.getById(payrollId);
    if (!payroll) {
      logError('Payroll not found', {
        timestamp: new Date().toISOString(),
        references: {
          payrollId,
          userId
        },
        status: 'PAYROLL_NOT_FOUND'
      });
      throw new Error('Payroll not found');
    }

    if (payroll.status === PayrollStatus.VOIDED) {
      logError('Payroll already voided', {
        timestamp: new Date().toISOString(),
        payrollId,
        userId,
        currentStatus: payroll.status,
        status: 'ALREADY_VOIDED'
      });
      throw new Error('Payroll is already voided');
    }

    if (payroll.status === PayrollStatus.RELEASED) {
      logError('Cannot void released payroll', {
        timestamp: new Date().toISOString(),
        payrollId,
        userId,
        currentStatus: payroll.status,
        status: 'CANNOT_VOID_RELEASED'
      });
      throw new Error('Cannot void a released payroll');
    }

    // Log voiding decision
    logInfo('PAYROLL_VOID', {
      timestamp: new Date().toISOString(),
      references: {
        payrollId,
        employeeId: payroll.employeeId,
        period: {
          start: payroll.periodStart.toISOString().split('T')[0],
          end: payroll.periodEnd.toISOString().split('T')[0]
        }
      },
      userId,
      reason: reason,
      status: 'VOIDING'
    });

    const updatedPayroll = await payrollController.update(payrollId, {
      status: PayrollStatus.VOIDED,
      voidedAt: new Date(),
      voidedBy: userId,
      voidReason: reason
    });

    // Log the voiding
    const payrollLogService = PayrollLogService.getInstance();
    await payrollLogService.logAction({
      payrollId,
      action: 'VOIDED',
      previousStatus: payroll.status,
      newStatus: 'VOIDED',
      reason,
      userId
    });

    logInfo('PAYROLL_VOID', {
      timestamp: new Date().toISOString(),
      payrollId,
      userId,
      reason: reason,
      newStatus: 'VOIDED',
      status: 'COMPLETED'
    });

    return updatedPayroll;
  }
}

let payrollService: PayrollService;

export function getPayrollService(): PayrollService {
  if (!payrollService) {
    payrollService = new PayrollService();
  }
  return payrollService;
}
