import { PrismaClient } from '@prisma/client';

export class PayrollPeriodController {
  constructor(private prisma: PrismaClient) {}

  async getAll(organizationId: string) {
    return await this.prisma.payrollPeriod.findMany({
      where: {
        organizationId,
      },
      include: {
        payrolls: {
          select: {
            id: true,
            employeeId: true,
            grossPay: true,
            netPay: true,
            processedAt: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async getById(organizationId: string, startDate: Date, endDate: Date) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: {
        organizationId_startDate_endDate: {
          organizationId,
          startDate,
          endDate,
        },
      },
      include: {
        payrolls: {
          include: {
            employee: {
              include: {
                department: true,
                jobTitle: true,
              },
            },
            deductions: true,
            earnings: true,
          },
        },
      },
    });

    if (!period) {
      throw new Error('Payroll period not found');
    }

    return period;
  }

  async create(organizationId: string, data: {
    startDate: Date;
    endDate: Date;
    payDate: Date;
    type?: string;
    year?: number;
    month?: number;
    periodNumber?: number;
  }) {
    // Check for overlapping periods
    const overlapping = await this.checkOverlappingPeriods(
      organizationId,
      data.startDate,
      data.endDate
    );

    if (overlapping.length > 0) {
      throw new Error('Payroll period overlaps with existing periods');
    }

    return await this.prisma.payrollPeriod.create({
      data: {
        organizationId,
        startDate: data.startDate,
        endDate: data.endDate,
        payDate: data.payDate,
        status: 'PENDING',
        type: data.type || 'MONTHLY',
        year: data.year || data.startDate.getFullYear(),
        month: data.month || data.startDate.getMonth() + 1,
        periodNumber: data.periodNumber,
      },
      include: {
        payrolls: true,
      },
    });
  }

  async update(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    data: Partial<{
      payDate: Date;
      status: string;
      type: string;
      year: number;
      month: number;
      periodNumber: number;
      startDate: Date;
      endDate: Date;
    }>
  ) {
    const existing = await this.getById(organizationId, startDate, endDate);

    // If updating dates, check for overlaps
    if (data.startDate || data.endDate) {
      const newStartDate = data.startDate || existing.startDate;
      const newEndDate = data.endDate || existing.endDate;

      // If this is an existing record being updated, we need to temporarily exclude it from overlap check
      const overlapping = await this.prisma.payrollPeriod.findMany({
        where: {
          organizationId,
          NOT: {
            startDate: existing.startDate,
            endDate: existing.endDate,
          },
          OR: [
            {
              AND: [
                { startDate: { lte: newStartDate } },
                { endDate: { gte: newStartDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: newEndDate } },
                { endDate: { gte: newEndDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: newStartDate } },
                { endDate: { lte: newEndDate } },
              ],
            },
          ],
        },
      });

      if (overlapping.length > 0) {
        throw new Error('Updated payroll period overlaps with existing periods');
      }
    }

    return await this.prisma.payrollPeriod.update({
      where: {
        organizationId_startDate_endDate: {
          organizationId,
          startDate: existing.startDate,
          endDate: existing.endDate,
        },
      },
      data,
      include: {
        payrolls: true,
      },
    });
  }

  async delete(organizationId: string, startDate: Date, endDate: Date) {
    const existing = await this.getById(organizationId, startDate, endDate);

    // Check if period has payrolls
    if (existing.payrolls.length > 0) {
      throw new Error('Cannot delete payroll period with existing payrolls');
    }

    return await this.prisma.payrollPeriod.delete({
      where: {
        organizationId_startDate_endDate: {
          organizationId,
          startDate,
          endDate,
        },
      },
    });
  }

  async closePeriod(organizationId: string, startDate: Date, endDate: Date) {
    const existing = await this.getById(organizationId, startDate, endDate);

    if (existing.status === 'COMPLETED') {
      throw new Error('Payroll period is already completed');
    }

    if (existing.status === 'CANCELLED') {
      throw new Error('Cannot close a cancelled payroll period');
    }

    return await this.prisma.payrollPeriod.update({
      where: {
        organizationId_startDate_endDate: {
          organizationId,
          startDate,
          endDate,
        },
      },
      data: {
        status: 'COMPLETED',
      },
      include: {
        payrolls: true,
      },
    });
  }

  async getCurrentPeriod(organizationId: string) {
    const now = new Date();
    
    return await this.prisma.payrollPeriod.findFirst({
      where: {
        organizationId,
        startDate: { lte: now },
        endDate: { gte: now },
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
      include: {
        payrolls: {
          select: {
            id: true,
            employeeId: true,
            grossPay: true,
            netPay: true,
            processedAt: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async getPeriodsByYear(organizationId: string, year: number) {
    return await this.prisma.payrollPeriod.findMany({
      where: {
        organizationId,
        year,
      },
      include: {
        payrolls: {
          select: {
            id: true,
            grossPay: true,
            netPay: true,
            processedAt: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async getPeriodsByStatus(organizationId: string, status: string) {
    return await this.prisma.payrollPeriod.findMany({
      where: {
        organizationId,
        status,
      },
      include: {
        payrolls: {
          select: {
            id: true,
            employeeId: true,
            grossPay: true,
            netPay: true,
            processedAt: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  private async checkOverlappingPeriods(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await this.prisma.payrollPeriod.findMany({
      where: {
        organizationId,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });
  }
}
