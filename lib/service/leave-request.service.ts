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
    const result = await leaveRequestController.getAll(undefined, undefined);
    
    // Always wrap the array in paginated format since controller returns raw array
    const data = result as LeaveRequest[];
    
    if (options) {
      // Apply pagination if options provided
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedData = data.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        total: data.length,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(data.length / options.limit)
      };
    }
    
    // Return all data as single page
    return {
      data: data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1
    };
  }

  async getApprovedLeaveByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<LeaveRequest[]> {
    return await leaveRequestController.getApprovedByEmployeeAndDateRange(employeeId, startDate, endDate);
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
