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
        // TODO: Fix approvedBy relation - temporarily removed due to schema sync issue
        // approvedBy: {
        //   select: {
        //     id: true,
        //     firstName: true,
        //     lastName: true,
        //   },
        // },
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        // TODO: Fix approvedBy relation - temporarily removed due to schema sync issue
        // approvedBy: {
        //   select: {
        //     id: true,
        //     firstName: true,
        //     lastName: true,
        //   },
        // },
      },
    });
  }

  async update(id: string, data: UpdateLeaveRequest) {
    // Filter out fields that shouldn't be directly updated
    const { 
      employeeId, 
      organizationId, 
      departmentId, 
      startDate, 
      endDate, 
      leaveType,
      ...updateData 
    } = data;
    
    return await prisma.leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
        // TODO: Fix approvedBy relation - temporarily removed due to schema sync issue
        // approvedBy: {
        //   select: {
        //     id: true,
        //     firstName: true,
        //     lastName: true,
        //   },
        // },
      },
    });
  }

  async delete(id: string) {
    return await prisma.leaveRequest.delete({
      where: { id },
    });
  }

  async approve(id: string, approvedById?: string) {
    return await this.update(id, { status: 'APPROVED' as any, ...(approvedById && { approvedById }) });
  }

  async reject(id: string, remarks?: string, rejectedById?: string) {
    return await this.update(id, { status: 'REJECTED' as any, remarks, ...(rejectedById && { approvedById: rejectedById }) });
  }
}

export const leaveRequestController = new LeaveRequestController();
