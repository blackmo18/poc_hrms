import { prisma } from '../db';
import { CreateLeaveRequest, UpdateLeaveRequest } from '../models/leave-request';
import { generateULID } from '../utils/ulid.service';

export class LeaveRequestController {
  async getAll(employeeId?: string, status?: string, options?: any) {
    return await prisma.leaveRequest.findMany({
      where: {
        ...(employeeId && { employeeId: employeeId }),
        ...(status && { status: status as any }),
      },
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getApprovedByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date) {
    return await prisma.leaveRequest.findMany({
      where: {
        employeeId: employeeId,
        status: 'APPROVED',
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              {
                startDate: {
                  lte: startDate,
                },
              },
              {
                endDate: {
                  gte: endDate,
                },
              },
            ],
          },
        ],
      },
    });
  }

  async getById(id: string) {
    return await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
            manager: true,
          },
        },
      },
    });
  }

  async create(data: CreateLeaveRequest) {
    return await prisma.leaveRequest.create({
      data: { id: generateULID(), ...data } as any,
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateLeaveRequest) {
    return await prisma.leaveRequest.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.leaveRequest.delete({
      where: { id },
    });
  }

  async approve(id: string) {
    return await this.update(id, { status: 'APPROVED' });
  }

  async reject(id: string, remarks?: string) {
    return await this.update(id, { status: 'REJECTED', remarks });
  }
}

export const leaveRequestController = new LeaveRequestController();
