import { prisma } from '../db';
import { CreatePayroll, UpdatePayroll } from '../models/payroll';
import { generateULID } from '../utils/ulid.service';
import { PayrollCalculationService } from '../service/payroll-calculation.service';
import { employeePayrollService } from '../service/employee-payroll.service';
import { payrollLogService } from '../service/payroll-log.service';
import { PayrollStatus } from '@prisma/client';
import { sharedPayrollCalculation } from '../service/shared-payroll-calculation';
import { PayrollRecord } from '../types/payroll.types';

function getDIContainer() {
  const { DIContainer } = require('../di/container');
  return DIContainer.getInstance();
}

let payrollCalculationService: PayrollCalculationService;
function getPayrollCalculationService(): PayrollCalculationService {
  if (!payrollCalculationService) {
    payrollCalculationService = getDIContainer().getPayrollCalculationService();
  }
  return payrollCalculationService;
}

export class PayrollController {
  constructor(private prisma: any) {}
  async getAll(employeeId?: string, periodStart?: Date, periodEnd?: Date) {
    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (periodStart && periodEnd) {
      where.periodStart = {
        gte: periodStart,
        lte: periodEnd,
      };
      where.periodEnd = {
        gte: periodStart,
        lte: periodEnd,
      };
    } else if (periodStart) {
      where.periodStart = { gte: periodStart };
    } else if (periodEnd) {
      where.periodEnd = { lte: periodEnd };
    }

    return await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            jobTitle: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        deductions: true,
      },
      orderBy: {
        processedAt: 'desc',
      },
    });
  }

  async getPayrollsByOrganizationAndPeriod(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    return await prisma.payroll.findMany({
      where: {
        organizationId,
        ...(departmentId && { departmentId }),
        periodStart: {
          gte: periodStart,
          lte: periodEnd,
        },
        periodEnd: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        employeeId: true,
        processedAt: true,
        periodStart: true,
        periodEnd: true,
        status: true,
        taxDeduction: true,
        philhealthDeduction: true,
        sssDeduction: true,
        pagibigDeduction: true,
        totalDeductions: true,
        grossPay: true,
        netPay: true,
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        deductions: {
          select: {
            id: true,
            type: true,
            amount: true
          }
        }
      },
      orderBy: {
        processedAt: 'desc',
      },
    });
  }

  async getById(id: string) {
    return await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
        deductions: true,
      },
    });
  }

  async create(data: CreatePayroll) {
    console.log(`[PAYROLL_CONTROLLER] Creating payroll record`, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: {
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        periodStart: data.periodStart?.toISOString(),
        periodEnd: data.periodEnd?.toISOString(),
        grossPay: data.grossPay,
        netPay: data.netPay,
        governmentDeductions: {
          tax: data.taxDeduction,
          philhealth: data.philhealthDeduction,
          sss: data.sssDeduction,
          pagibig: data.pagibigDeduction,
          total: data.totalDeductions
        },
        status: data.status
      },
      action: 'PAYROLL_CREATE_START'
    }));

    try {
      const payroll = await this.prisma.payroll.create({
        data: {
          id: generateULID(),
          employeeId: data.employeeId,
          organizationId: data.organizationId,
          departmentId: data.departmentId,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          grossPay: data.grossPay,
          netPay: data.netPay,
          taxableIncome: data.taxableIncome,
          taxDeduction: data.taxDeduction,
          philhealthDeduction: data.philhealthDeduction,
          sssDeduction: data.sssDeduction,
          pagibigDeduction: data.pagibigDeduction,
          totalDeductions: data.totalDeductions,
          status: data.status || PayrollStatus.COMPUTED,
        },
        include: {
          employee: {
            include: {
              department: true,
              jobTitle: true,
            },
          },
          deductions: true,
        },
      });

      console.log(`[PAYROLL_CONTROLLER] Payroll record created successfully`, JSON.stringify({
        timestamp: new Date().toISOString(),
        payrollId: payroll.id,
        employeeId: payroll.employeeId,
        organizationId: payroll.organizationId,
        grossPay: payroll.grossPay,
        netPay: payroll.netPay,
        savedGovernmentDeductions: {
          tax: payroll.taxDeduction,
          philhealth: payroll.philhealthDeduction,
          sss: payroll.sssDeduction,
          pagibig: payroll.pagibigDeduction,
          total: payroll.totalDeductions
        },
        status: payroll.status,
        action: 'PAYROLL_CREATE_SUCCESS'
      }));

      return payroll;
    } catch (error) {
      console.error(`[PAYROLL_CONTROLLER] Payroll creation failed`, JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        data: {
          employeeId: data.employeeId,
          organizationId: data.organizationId,
          departmentId: data.departmentId,
          periodStart: data.periodStart?.toISOString(),
          periodEnd: data.periodEnd?.toISOString(),
          grossPay: data.grossPay,
          netPay: data.netPay
        },
        action: 'PAYROLL_CREATE_ERROR'
      }));
      throw error;
    }
  }

  async update(id: string, data: UpdatePayroll) {
    return await prisma.payroll.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
        deductions: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.payroll.delete({
      where: { id },
    });
  }

  async processPayroll(employeeId: string, organizationId: string, departmentId: string | undefined, periodStart: Date, periodEnd: Date, userId?: string) {
    // Log critical flow start
    console.log(`[PAYROLL_GENERATION] Starting payroll processing`, JSON.stringify({
      timestamp: new Date().toISOString(),
      references: {
        organizationId,
        employeeId,
        departmentId,
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: periodEnd.toISOString().split('T')[0]
        }
      },
      status: 'STARTED'
    }));

    try {
      // Use shared calculation logic
      const result = await sharedPayrollCalculation.calculatePayroll({
        employeeId,
        organizationId,
        departmentId,
        periodStart,
        periodEnd,
        options: {
          persistData: true,
          userId: userId || 'system',
          status: PayrollStatus.COMPUTED
        }
      });

      // Update payroll period status if applicable
      const payrollPeriod = await prisma.payrollPeriod.findFirst({
        where: {
          organizationId,
          startDate: { lte: periodStart },
          endDate: { gte: periodEnd },
        },
      });

      if (payrollPeriod && payrollPeriod.status === 'PENDING') {
        await prisma.payrollPeriod.update({
          where: { 
            organizationId_startDate_endDate: {
              organizationId: payrollPeriod.organizationId,
              startDate: payrollPeriod.startDate,
              endDate: payrollPeriod.endDate,
            }
          },
          data: { status: 'PROCESSING' },
        });
      }

      // Log critical flow completion
      console.log(`[PAYROLL_GENERATION] Payroll processing completed`, JSON.stringify({
        timestamp: new Date().toISOString(),
        references: {
          organizationId,
          employeeId,
          payrollId: result.payrollRecord.id,
          period: {
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          }
        },
        summary: {
          grossPay: result.calculationResult.total_gross_pay,
          netPay: result.calculationResult.total_net_pay,
          totalDeductions: result.calculationResult.total_deductions,
          earningsCount: result.earnings.length || 0,
          deductionsCount: result.deductions.length || 0
        },
        status: 'COMPLETED'
      }));

      return this.getById(result.payrollRecord.id);
    } catch (error) {
      console.error('[PAYROLL_GENERATION] Payroll processing failed', error);
      throw error;
    }
  }

  /**
   * Approve a computed payroll
   */
  async approvePayroll(payrollId: string, userId: string): Promise<PayrollRecord> {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    if (payroll.status !== PayrollStatus.COMPUTED) {
      throw new Error('Only computed payrolls can be approved');
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: PayrollStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    // Log approval
    await payrollLogService.logAction({
      payrollId,
      action: 'APPROVED',
      previousStatus: PayrollStatus.COMPUTED,
      newStatus: PayrollStatus.APPROVED,
      userId,
    });

    return updatedPayroll as PayrollRecord;
  }

  /**
   * Release an approved payroll
   */
  async releasePayroll(payrollId: string, userId: string): Promise<PayrollRecord> {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    if (payroll.status !== PayrollStatus.APPROVED) {
      throw new Error('Only approved payrolls can be released');
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: PayrollStatus.RELEASED,
        releasedAt: new Date(),
        releasedBy: userId,
      },
    });

    // Log release
    await payrollLogService.logAction({
      payrollId,
      action: 'RELEASED',
      previousStatus: PayrollStatus.APPROVED,
      newStatus: PayrollStatus.RELEASED,
      userId,
    });

    return updatedPayroll as PayrollRecord;
  }

  /**
   * Void a released payroll
   */
  async voidPayroll(payrollId: string, userId: string, reason?: string): Promise<PayrollRecord> {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    if (payroll.status !== PayrollStatus.RELEASED) {
      throw new Error('Only released payrolls can be voided');
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: PayrollStatus.VOIDED,
        voidedAt: new Date(),
        voidedBy: userId,
        voidReason: reason,
      },
    });

    // Log void
    await payrollLogService.logAction({
      payrollId,
      action: 'VOIDED',
      previousStatus: PayrollStatus.RELEASED,
      newStatus: PayrollStatus.VOIDED,
      reason,
      userId,
    });

    return updatedPayroll as PayrollRecord;
  }

  /**
   * Recalculate a draft payroll
   */
  async recalculatePayroll(payrollId: string, userId: string): Promise<PayrollRecord> {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    if (payroll.status !== PayrollStatus.DRAFT && payroll.status !== PayrollStatus.COMPUTED) {
      throw new Error('Only draft or computed payrolls can be recalculated');
    }

    // Delete existing earnings and deductions
    await prisma.payrollEarning.deleteMany({
      where: { payrollId },
    });
    await prisma.deduction.deleteMany({
      where: { payrollId },
    });

    // Recalculate payroll
    return await this.processPayroll(
      payroll.employeeId,
      payroll.organizationId,
      payroll.departmentId || undefined,
      payroll.periodStart,
      payroll.periodEnd,
      userId
    ) as PayrollRecord;
  }

  /**
   * Get payroll logs
   */
  async getPayrollLogs(payrollId: string) {
    return await payrollLogService.getPayrollHistory(payrollId);
  }

  /**
   * Check if payroll exists for a period and employee
   */
  async checkExistingPayroll(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PayrollRecord | null> {
    const payroll = await prisma.payroll.findFirst({
      where: {
        employeeId,
        periodStart,
        periodEnd,
        status: {
          not: PayrollStatus.VOIDED,
        },
      },
    });
    return payroll as PayrollRecord | null;
  }
}

export const payrollController = new PayrollController(prisma);
