import { prisma } from '../db';
import { CreatePayroll, UpdatePayroll } from '../models/payroll';
import { generateULID } from '../utils/ulid.service';
import { DIContainer } from '../di/container';

const diContainer = DIContainer.getInstance();
const payrollCalculationService = diContainer.getPayrollCalculationService();

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
    // TODO: Implement full payroll calculation when all controllers are available
    // For now, create a basic payroll record with PH deductions
    
    // Get employee data with compensation
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
      throw new Error('Employee not found');
    }

    // Get current compensation from the most recent record
    const currentCompensation = employee.compensations[0];
    if (!currentCompensation) {
      throw new Error('No compensation record found for employee');
    }

    // Use actual base salary from compensation
    const grossPay = currentCompensation.baseSalary;

    // Calculate PH government deductions
    const phDeductions = await payrollCalculationService.calculatePHDeductions(organizationId, grossPay);

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        id: generateULID(),
        employeeId: employeeId,
        organizationId: organizationId,
        departmentId: departmentId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        grossPay: grossPay,
        netPay: grossPay - phDeductions.totalDeductions,
        taxableIncome: phDeductions.taxableIncome,
        taxDeduction: phDeductions.tax,
        philhealthDeduction: phDeductions.philhealth,
        sssDeduction: phDeductions.sss,
        pagibigDeduction: phDeductions.pagibig,
        totalDeductions: phDeductions.totalDeductions,
        processedAt: new Date(),
      } as any,
    });

    // Create government deduction records
    const deductions = [
      { type: 'TAX', amount: phDeductions.tax },
      { type: 'PHILHEALTH', amount: phDeductions.philhealth },
      { type: 'SSS', amount: phDeductions.sss },
      { type: 'PAGIBIG', amount: phDeductions.pagibig },
    ].filter(d => d.amount > 0);

    if (deductions.length > 0) {
      await prisma.deduction.createMany({
        data: deductions.map(deduction => ({
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

    return this.getById(payroll.id);
  }
}

export const payrollController = new PayrollController();
