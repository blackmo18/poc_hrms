import { prisma } from '../db';
import { CreatePayroll, UpdatePayroll } from '../models/payroll';
import { generateULID } from '../utils/ulid.service';

export class PayrollController {
  async getAll(employeeId?: string, periodStart?: Date, periodEnd?: Date) {
    return await prisma.payroll.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(periodStart && { periodStart: { gte: periodStart } }),
        ...(periodEnd && { periodEnd: { lte: periodEnd } }),
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
      orderBy: {
        createdAt: 'desc',
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

  async processPayroll(employeeId: string, organizationId: string, departmentId: string | undefined, periodStart: Date, periodEnd: Date, grossSalary: number, deductions: Array<{ type: string; amount: number }>) {
    const netSalary = deductions.reduce((total, deduction) => total - deduction.amount, grossSalary);

    const payroll = await prisma.payroll.create({
      data: {
        id: generateULID(),
        employeeId: employeeId,
        organizationId: organizationId,
        departmentId: departmentId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        grossPay: grossSalary,
        netPay: netSalary,
        processedAt: new Date(),
      } as any,
    });

    // Create deductions
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
