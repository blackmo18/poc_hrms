import { prisma } from '../db';
import { CreateLeaveRequest, UpdateLeaveRequest } from '../models/leave-request';

export class LeaveRequestController {
  async getAll(employeeId?: number, status?: string) {
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

  async getById(id: number) {
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

  async update(id: number, data: UpdateLeaveRequest) {
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

  async delete(id: number) {
    return await prisma.leaveRequest.delete({
      where: { id },
    });
  }

  async approve(id: number) {
    return await this.update(id, { status: 'APPROVED' });
  }

  async reject(id: number, remarks?: string) {
    return await this.update(id, { status: 'REJECTED', remarks });
  }
}

export const leaveRequestController = new LeaveRequestController();
