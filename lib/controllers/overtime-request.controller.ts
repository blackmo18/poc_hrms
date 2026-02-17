import { prisma } from '../db';
import { generateULID } from '../utils/ulid.service';

export class OvertimeRequestController {
  async getAll(filters?: any, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.organizationId) where.organizationId = filters.organizationId;
    if (filters?.status) where.status = filters.status;
    if (filters?.work_date) where.workDate = filters.work_date;
    if (filters?.date_from || filters?.date_to) {
      where.workDate = {};
      if (filters?.date_from) where.workDate.gte = filters.date_from;
      if (filters?.date_to) where.workDate.lte = filters.date_to;
    }

    const total = await prisma.overtime.count({ where });
    const data = await prisma.overtime.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        workDate: true,
        requestedMinutes: true,
        approvedMinutes: true,
        status: true,
        reason: true,
        approvedByUserId: true,
        approvedAt: true,
        createdAt: true,
        organizationId: true,
        otType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        approvedByUser: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string) {
    return await prisma.overtime.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async create(data: any) {
    return await prisma.overtime.create({
      data: {
        id: generateULID(),
        employeeId: data.employeeId || data.employee_id,
        organizationId: data.organizationId || data.organizationId,
        workDate: data.workDate || data.work_date,
        requestedMinutes: data.requestedMinutes || data.requested_minutes,
        reason: data.reason,
        status: 'PENDING',
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async approve(id: string, approvedMinutes: number, approvedByUserId: string, updatedBy?: string) {
    return await prisma.overtime.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedMinutes,
        approvedByUserId,
        approvedAt: new Date(),
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async reject(id: string, updatedBy?: string) {
    return await prisma.overtime.update({
      where: { id },
      data: {
        status: 'REJECTED',
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async cancel(id: string, updatedBy?: string) {
    return await prisma.overtime.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      } as any,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getPendingRequests(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    const where: any = { status: 'PENDING' };
    if (organizationId) where.organizationId = organizationId;

    const total = await prisma.overtime.count({ where });
    const data = await prisma.overtime.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getPayableOvertimeMinutes(employeeId: string, workDate: Date): Promise<number> {
    const result = await prisma.overtime.findFirst({
      where: {
        employeeId,
        workDate,
        status: 'APPROVED',
      },
    });

    return result?.approvedMinutes || 0;
  }
}

export const overtimeRequestController = new OvertimeRequestController();
