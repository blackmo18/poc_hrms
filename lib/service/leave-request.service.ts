import { leaveRequestController } from '@/lib/controllers/leave-request.controller';
import { CreateLeaveRequest, UpdateLeaveRequest } from '@/lib/models/leave-request';
import { LeaveRequest } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';
import { generateULID } from '@/lib/utils/ulid.service';

export class LeaveRequestService {
  async getById(id: string): Promise<LeaveRequest | null> {
    return await leaveRequestController.getById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return await leaveRequestController.getAll(employeeId);
  }

  async getByStatus(status: string): Promise<LeaveRequest[]> {
    return await leaveRequestController.getAll(undefined, status);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<LeaveRequest>> {
    const result = await leaveRequestController.getAll();
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: CreateLeaveRequest): Promise<LeaveRequest> {
    return await leaveRequestController.create(data);
  }

  async update(id: string, data: UpdateLeaveRequest): Promise<LeaveRequest> {
    return await leaveRequestController.update(id, data);
  }

  async delete(id: string): Promise<LeaveRequest> {
    return await leaveRequestController.delete(id);
  }
}

let leaveRequestService: LeaveRequestService;

export function getLeaveRequestService(): LeaveRequestService {
  if (!leaveRequestService) {
    leaveRequestService = new LeaveRequestService();
  }
  return leaveRequestService;
}
