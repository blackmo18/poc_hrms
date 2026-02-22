import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export class DeductionController {
  constructor(private prisma: PrismaClient) {}

  async getAll(organizationId?: string, payrollId?: string, employeeId?: string) {
    const where: any = {};
    
    if (organizationId) where.organizationId = organizationId;
    if (payrollId) where.payrollId = payrollId;
    if (employeeId) where.employeeId = employeeId;

    return await this.prisma.deduction.findMany({
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
        createdAt: 'desc',
      },
    });
  }

  async getById(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;

    const deduction = await this.prisma.deduction.findFirst({
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

    if (!deduction) {
      throw new Error('Deduction not found');
    }

    return deduction;
  }

  async create(data: {
    payrollId: string;
    organizationId: string;
    employeeId: string;
    type: string;
    amount: number;
  }) {
    console.log(`[DEDUCTION_CONTROLLER] Creating deduction record`, JSON.stringify({
      timestamp: new Date().toISOString(),
      data: {
        payrollId: data.payrollId,
        organizationId: data.organizationId,
        employeeId: data.employeeId,
        type: data.type,
        amount: data.amount,
        isGovernmentDeduction: ['TAX', 'PHILHEALTH', 'SSS', 'PAGIBIG'].includes(data.type)
      },
      action: 'DEDUCTION_CREATE_START'
    }));
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

    const deduction = await this.prisma.deduction.create({
      data: {
        id: generateULID(),
        payrollId: data.payrollId,
        organizationId: data.organizationId,
        employeeId: data.employeeId,
        type: data.type,
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

    console.log(`[DEDUCTION_CONTROLLER] Deduction record created successfully`, JSON.stringify({
      timestamp: new Date().toISOString(),
      deductionId: deduction.id,
      payrollId: deduction.payrollId,
      type: deduction.type,
      amount: deduction.amount,
      isGovernmentDeduction: ['TAX', 'PHILHEALTH', 'SSS', 'PAGIBIG'].includes(deduction.type),
      action: 'DEDUCTION_CREATE_SUCCESS'
    }));

    return deduction;
  }

  async update(id: string, organizationId: string, data: Partial<{
    type: string;
    amount: number;
  }>) {
    const existing = await this.getById(id, organizationId);

    return await this.prisma.deduction.update({
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

    return await this.prisma.deduction.delete({
      where: { id },
    });
  }

  async findByPayrollId(payrollId: string, organizationId?: string) {
    const where: any = { payrollId };
    if (organizationId) where.organizationId = organizationId;

    return await this.prisma.deduction.findMany({
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
    return await this.prisma.deduction.findMany({
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
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async findByType(
    type: string,
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

    return await this.prisma.deduction.findMany({
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
        createdAt: 'desc',
      },
    });
  }

  async getDeductionTotalsByPayroll(payrollId: string, organizationId: string) {
    const deductions = await this.prisma.deduction.groupBy({
      by: ['type'],
      where: {
        payrollId,
        organizationId,
      },
      _sum: {
        amount: true,
      },
    });

    return deductions.map(d => ({
      type: d.type,
      total: d._sum.amount || 0,
    }));
  }

  async getDeductionTotalsByEmployee(
    employeeId: string,
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    const deductions = await this.prisma.deduction.groupBy({
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
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return deductions.map(d => ({
      type: d.type,
      total: d._sum.amount || 0,
      count: d._count.id,
    }));
  }

  async bulkCreate(deductions: Array<{
    payrollId: string;
    organizationId: string;
    employeeId: string;
    type: string;
    amount: number;
  }>) {
    // Verify all payrolls and employees exist
    const payrollIds = [...new Set(deductions.map(d => d.payrollId))];
    const employeeIds = [...new Set(deductions.map(d => d.employeeId))];

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

    // Validate all deductions
    for (const deduction of deductions) {
      const payroll = payrollMap.get(deduction.payrollId);
      const employee = employeeMap.get(deduction.employeeId);

      if (!payroll || payroll.organizationId !== deduction.organizationId) {
        throw new Error(`Payroll ${deduction.payrollId} not found or invalid`);
      }

      if (!employee || employee.organizationId !== deduction.organizationId) {
        throw new Error(`Employee ${deduction.employeeId} not found or invalid`);
      }
    }

    // Create all deductions
    return await this.prisma.deduction.createMany({
      data: deductions.map(d => ({
        id: generateULID(),
        ...d,
      })),
    });
  }
}
