import { prisma } from '../db';
import { CreatePayroll, UpdatePayroll } from '../models/payroll';

export class PayrollController {
  async getAll(employeeId?: bigint, periodStart?: Date, periodEnd?: Date) {
    return await prisma.payroll.findMany({
      where: {
        ...(employeeId && { employee_id: employeeId }),
        ...(periodStart && { period_start: { gte: periodStart } }),
        ...(periodEnd && { period_end: { lte: periodEnd } }),
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
        created_at: 'desc',
      },
    });
  }

  async getById(id: bigint) {
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
        ...data,
        processed_at: new Date(),
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
  }

  async update(id: bigint, data: UpdatePayroll) {
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

  async delete(id: bigint) {
    return await prisma.payroll.delete({
      where: { id },
    });
  }

  async processPayroll(employeeId: bigint, periodStart: Date, periodEnd: Date, grossSalary: number, deductions: Array<{ type: string; amount: number }>) {
    const netSalary = deductions.reduce((total, deduction) => total - deduction.amount, grossSalary);

    const payroll = await prisma.payroll.create({
      data: {
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        gross_salary: grossSalary,
        net_salary: netSalary,
        processed_at: new Date(),
      },
    });

    // Create deductions
    if (deductions.length > 0) {
      await prisma.deduction.createMany({
        data: deductions.map(deduction => ({
          payroll_id: payroll.id,
          type: deduction.type,
          amount: deduction.amount,
        })),
      });
    }

    return this.getById(payroll.id);
  }
}

export const payrollController = new PayrollController();
