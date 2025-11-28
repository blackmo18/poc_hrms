import { prisma } from '../db';
import { CreateLeaveRequest, UpdateLeaveRequest } from '../models/leave-request';

export class LeaveRequestController {
  async getAll(employeeId?: bigint, status?: string) {
    return await prisma.leaveRequest.findMany({
      where: {
        ...(employeeId && { employee_id: employeeId }),
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
        created_at: 'desc',
      },
    });
  }

  async getById(id: bigint) {
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

  async update(id: bigint, data: UpdateLeaveRequest) {
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

  async delete(id: bigint) {
    return await prisma.leaveRequest.delete({
      where: { id },
    });
  }

  async approve(id: bigint) {
    return await this.update(id, { status: 'APPROVED' });
  }

  async reject(id: bigint, remarks?: string) {
    return await this.update(id, { status: 'REJECTED', remarks });
  }
}

export const leaveRequestController = new LeaveRequestController();
