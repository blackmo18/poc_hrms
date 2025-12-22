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

  async getByPublicId(public_id: string) {
    return await prisma.leaveRequest.findUnique({
      where: { public_id },
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

  async updateByPublicId(public_id: string, data: UpdateLeaveRequest) {
    return await prisma.leaveRequest.update({
      where: { public_id },
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

  async deleteByPublicId(public_id: string) {
    return await prisma.leaveRequest.delete({
      where: { public_id },
    });
  }

  async approve(id: number) {
    return await this.update(id, { status: 'APPROVED' });
  }

  async reject(id: number, remarks?: string) {
    return await this.update(id, { status: 'REJECTED', remarks });
  }

  async approveByPublicId(public_id: string) {
    return await this.updateByPublicId(public_id, { status: 'APPROVED' });
  }

  async rejectByPublicId(public_id: string, remarks?: string) {
    return await this.updateByPublicId(public_id, { status: 'REJECTED', remarks });
  }
}

export const leaveRequestController = new LeaveRequestController();
