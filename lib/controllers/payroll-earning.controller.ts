import { PrismaClient, PayrollEarningType } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class PayrollEarningController {
  constructor(private prisma: PrismaClient) {}

  async getAll(organizationId?: string, payrollId?: string, employeeId?: string) {
    const where: any = {};
    
    if (organizationId) where.organizationId = organizationId;
    if (payrollId) where.payrollId = payrollId;
    if (employeeId) where.employeeId = employeeId;

    return await this.prisma.payrollEarning.findMany({
      where,
      include: {
        payroll: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            processedAt: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        type: 'asc',
      },
    });
  }

  async getById(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;

    const earning = await this.prisma.payrollEarning.findFirst({
      where,
      include: {
        payroll: {
          include: {
            payrollPeriod: true,
          },
        },
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
      },
    });

    if (!earning) {
      throw new Error('Payroll earning not found');
    }

    return earning;
  }

  async create(data: {
    payrollId: string;
    organizationId: string;
    employeeId: string;
    type: PayrollEarningType;
    hours: number;
    rate: number;
    amount: number;
  }) {
    // Verify payroll exists and belongs to organization
    const payroll = await this.prisma.payroll.findFirst({
      where: {
        id: data.payrollId,
        organizationId: data.organizationId,
      },
    });

    if (!payroll) {
      throw new Error('Payroll not found or does not belong to this organization');
    }

    // Verify employee exists and belongs to organization
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        organizationId: data.organizationId,
      },
    });

    if (!employee) {
      throw new Error('Employee not found or does not belong to this organization');
    }

    return await this.prisma.payrollEarning.create({
      data: {
        id: generateULID(),
        payrollId: data.payrollId,
        organizationId: data.organizationId,
        employeeId: data.employeeId,
        type: data.type,
        hours: data.hours,
        rate: data.rate,
        amount: data.amount,
      },
      include: {
        payroll: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });
  }

  async update(id: string, organizationId: string, data: Partial<{
    type: PayrollEarningType;
    hours: number;
    rate: number;
    amount: number;
  }>) {
    const existing = await this.getById(id, organizationId);

    return await this.prisma.payrollEarning.update({
      where: { id },
      data,
      include: {
        payroll: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await this.getById(id, organizationId);

    return await this.prisma.payrollEarning.delete({
      where: { id },
    });
  }

  async findByPayrollId(payrollId: string, organizationId?: string) {
    const where: any = { payrollId };
    if (organizationId) where.organizationId = organizationId;

    return await this.prisma.payrollEarning.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        type: 'asc',
      },
    });
  }

  async findByEmployeeId(
    employeeId: string,
    organizationId: string,
    limit?: number
  ) {
    return await this.prisma.payrollEarning.findMany({
      where: {
        employeeId,
        organizationId,
      },
      include: {
        payroll: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            processedAt: true,
          },
        },
      },
      orderBy: {
        type: 'asc',
      },
      take: limit,
    });
  }

  async findByType(
    type: PayrollEarningType,
    organizationId: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    const where: any = {
      type,
      organizationId,
    };

    if (periodStart && periodEnd) {
      where.payroll = {
        periodStart: {
          gte: periodStart,
        },
        periodEnd: {
          lte: periodEnd,
        },
      };
    }

    return await this.prisma.payrollEarning.findMany({
      where,
      include: {
        payroll: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        type: 'asc',
      },
    });
  }

  async getEarningTotalsByPayroll(payrollId: string, organizationId: string) {
    const earnings = await this.prisma.payrollEarning.groupBy({
      by: ['type'],
      where: {
        payrollId,
        organizationId,
      },
      _sum: {
        hours: true,
        amount: true,
      },
      _avg: {
        rate: true,
      },
    });

    return earnings.map(e => ({
      type: e.type,
      totalHours: e._sum.hours || 0,
      totalAmount: e._sum.amount || 0,
      averageRate: e._avg.rate || 0,
    }));
  }

  async getEarningTotalsByEmployee(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const earnings = await this.prisma.payrollEarning.groupBy({
      by: ['type'],
      where: {
        employeeId,
        organizationId,
        payroll: {
          periodStart: {
            gte: periodStart,
          },
          periodEnd: {
            lte: periodEnd,
          },
        },
      },
      _sum: {
        hours: true,
        amount: true,
      },
      _avg: {
        rate: true,
      },
      _count: {
        id: true,
      },
    });

    return earnings.map(e => ({
      type: e.type,
      totalHours: e._sum.hours || 0,
      totalAmount: e._sum.amount || 0,
      averageRate: e._avg.rate || 0,
      count: e._count.id,
    }));
  }

  async bulkCreate(earnings: Array<{
    payrollId: string;
    organizationId: string;
    employeeId: string;
    type: PayrollEarningType;
    hours: number;
    rate: number;
    amount: number;
  }>) {
    // Verify all payrolls and employees exist
    const payrollIds = [...new Set(earnings.map(e => e.payrollId))];
    const employeeIds = [...new Set(earnings.map(e => e.employeeId))];

    const payrolls = await this.prisma.payroll.findMany({
      where: {
        id: { in: payrollIds },
      },
    });

    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
      },
    });

    const payrollMap = new Map(payrolls.map(p => [p.id, p]));
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Validate all earnings
    for (const earning of earnings) {
      const payroll = payrollMap.get(earning.payrollId);
      const employee = employeeMap.get(earning.employeeId);

      if (!payroll || payroll.organizationId !== earning.organizationId) {
        throw new Error(`Payroll ${earning.payrollId} not found or invalid`);
      }

      if (!employee || employee.organizationId !== earning.organizationId) {
        throw new Error(`Employee ${earning.employeeId} not found or invalid`);
      }
    }

    // Create all earnings
    return await this.prisma.payrollEarning.createMany({
      data: earnings.map(e => ({
        id: generateULID(),
        ...e,
      })),
    });
  }

  async getEmployeeEarningSummary(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const earnings = await this.prisma.payrollEarning.findMany({
      where: {
        employeeId,
        organizationId,
        payroll: {
          periodStart: {
            gte: periodStart,
          },
          periodEnd: {
            lte: periodEnd,
          },
        },
      },
      include: {
        payroll: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
          },
        },
      },
      orderBy: {
        payroll: {
          periodStart: 'asc',
        },
      },
    });

    // Group by payroll period
    const grouped = earnings.reduce((acc, earning) => {
      const payrollId = earning.payrollId;
      if (!acc[payrollId]) {
        acc[payrollId] = {
          payrollId,
          periodStart: earning.payroll.periodStart,
          periodEnd: earning.payroll.periodEnd,
          earnings: [],
          totalAmount: 0,
          totalHours: 0,
        };
      }
      acc[payrollId].earnings.push(earning);
      acc[payrollId].totalAmount += earning.amount;
      acc[payrollId].totalHours += earning.hours;
      return acc;
    }, {} as any);

    return Object.values(grouped);
  }
}
