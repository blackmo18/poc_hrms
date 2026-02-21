import { prisma } from '../db';
import { CreatePayroll, UpdatePayroll } from '../models/payroll';
import { generateULID } from '../utils/ulid.service';
import { PayrollCalculationService } from '../service/payroll-calculation.service';
import { employeePayrollService } from '../service/employee-payroll.service';

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
        processedAt: true,
        periodStart: true,
        periodEnd: true,
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
    return await prisma.payroll.create({
      data: {
        id: generateULID(),
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        grossPay: data.grossPay,
        netPay: data.netPay,
      } as any,
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

  async processPayroll(employeeId: string, organizationId: string, departmentId: string | undefined, periodStart: Date, periodEnd: Date) {
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
    
    // Get employee data with compensation and work schedule
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        jobTitle: true,
        compensations: {
          where: {
            effectiveDate: { lte: new Date() }
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1
        }
      },
    });

    if (!employee) {
      console.log(`[PAYROLL_GENERATION] Payroll processing failed`, JSON.stringify({
        timestamp: new Date().toISOString(),
        references: {
          organizationId,
          employeeId,
          period: {
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          }
        },
        error: 'Employee not found',
        status: 'FAILED'
      }));
      throw new Error('Employee not found');
    }

    // Get current compensation from the most recent record
    const currentCompensation = employee.compensations[0];
    if (!currentCompensation) {
      console.log(`[PAYROLL_GENERATION] Payroll processing failed`, JSON.stringify({
        timestamp: new Date().toISOString(),
        references: {
          organizationId,
          employeeId,
          period: {
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          }
        },
        error: 'No compensation record found for employee',
        status: 'FAILED'
      }));
      throw new Error('No compensation record found for employee');
    }

    // Use the enhanced payroll calculation service
    const calculationResult = await getPayrollCalculationService().calculateCompletePayroll(
      organizationId,
      employeeId,
      periodStart,
      periodEnd,
      currentCompensation.baseSalary
    );

    // Create payroll record with enhanced data
    const payroll = await prisma.payroll.create({
      data: {
        id: generateULID(),
        employeeId: employeeId,
        organizationId: employee.department?.organizationId || organizationId, // Use employee's organization ID
        departmentId: departmentId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        grossPay: calculationResult.total_gross_pay,
        netPay: calculationResult.total_net_pay,
        taxableIncome: calculationResult.taxable_income,
        taxDeduction: calculationResult.government_deductions.tax,
        philhealthDeduction: calculationResult.government_deductions.philhealth,
        sssDeduction: calculationResult.government_deductions.sss,
        pagibigDeduction: calculationResult.government_deductions.pagibig,
        totalDeductions: calculationResult.total_deductions,
        processedAt: new Date(),
      } as any,
    });

    // Create detailed deduction records
    const allDeductions = [
      // Government deductions
      { type: 'TAX', amount: calculationResult.government_deductions.tax },
      { type: 'PHILHEALTH', amount: calculationResult.government_deductions.philhealth },
      { type: 'SSS', amount: calculationResult.government_deductions.sss },
      { type: 'PAGIBIG', amount: calculationResult.government_deductions.pagibig },
      // Policy deductions
      { type: 'LATE', amount: calculationResult.policy_deductions.late },
      { type: 'ABSENCE', amount: calculationResult.policy_deductions.absence },
    ].filter(d => d.amount > 0);

    if (allDeductions.length > 0) {
      await prisma.deduction.createMany({
        data: allDeductions.map(deduction => ({
          id: generateULID(),
          payrollId: payroll.id,
          employeeId,
          organizationId,
          type: deduction.type,
          amount: deduction.amount,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
    }

    // Create detailed earning records
    const earnings = [];
    
    // Regular pay
    if (calculationResult.total_regular_pay > 0) {
      earnings.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId,
        employeeId,
        type: 'BASE_SALARY',
        hours: calculationResult.total_regular_minutes / 60,
        rate: currentCompensation.baseSalary / 160, // Assuming 160 hours per month
        amount: calculationResult.total_regular_pay,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Overtime pay
    if (calculationResult.total_overtime_pay > 0) {
      earnings.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId,
        employeeId,
        type: 'OVERTIME',
        hours: calculationResult.total_overtime_minutes / 60,
        rate: (currentCompensation.baseSalary / 160) * 1.25, // Overtime rate
        amount: calculationResult.total_overtime_pay,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Night differential pay
    if (calculationResult.total_night_diff_pay > 0) {
      earnings.push({
        id: generateULID(),
        payrollId: payroll.id,
        organizationId,
        employeeId,
        type: 'NIGHT_DIFFERENTIAL',
        hours: calculationResult.total_night_diff_minutes / 60,
        rate: (currentCompensation.baseSalary / 160) * 0.1, // Night diff rate
        amount: calculationResult.total_night_diff_pay,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (earnings.length > 0) {
      await prisma.payrollEarning.createMany({
        data: earnings,
      });
    }

    // Update payroll period status if applicable
    // This would require finding the relevant payroll period
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
        payrollId: payroll.id,
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: periodEnd.toISOString().split('T')[0]
        }
      },
      summary: {
        grossPay: calculationResult.total_gross_pay,
        netPay: calculationResult.total_net_pay,
        totalDeductions: calculationResult.total_deductions,
        earningsCount: earnings.length,
        deductionsCount: allDeductions.length
      },
      status: 'COMPLETED'
    }));

    return this.getById(payroll.id);
  }
}

export const payrollController = new PayrollController();
