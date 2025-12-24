import { BaseRepository } from './base.repository';
import { LeaveRequest } from '@prisma/client';

export class LeaveRequestRepository extends BaseRepository {
  async findById(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
    });
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      where: { employee_id: employeeId },
    });
  }

  async findByStatus(status: string): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      where: { status },
    });
  }

  async findAll(): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany();
  }

  async create(data: Omit<LeaveRequest, 'created_at' | 'updated_at'>): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.create({
      data,
    });
  }

  async update(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.delete({
      where: { id },
    });
  }
}

let leaveRequestRepository: LeaveRequestRepository;

export function getLeaveRequestRepository(): LeaveRequestRepository {
  if (!leaveRequestRepository) {
    leaveRequestRepository = new LeaveRequestRepository();
  }
  return leaveRequestRepository;
}
