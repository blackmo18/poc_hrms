import { getLeaveRequestRepository } from '@/lib/repository';
import { generateULID } from '@/lib/utils/ulid.service';
import { LeaveRequest } from '@prisma/client';
import { PaginationOptions, PaginatedResponse } from './organization.service';

export class LeaveRequestService {
  private leaveRequestRepository = getLeaveRequestRepository();

  async getById(id: string): Promise<LeaveRequest | null> {
    return await this.leaveRequestRepository.findById(id);
  }

  async getByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.findByEmployeeId(employeeId);
  }

  async getByStatus(status: string): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.findByStatus(status);
  }

  async getAll(options?: PaginationOptions): Promise<PaginatedResponse<LeaveRequest>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [leaveRequests, total] = await Promise.all([
      this.leaveRequestRepository.findAll().then(results =>
        results.slice(skip, skip + limit)
      ),
      this.leaveRequestRepository.findAll().then(results => results.length)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: leaveRequests,
      total,
      page,
      limit,
      totalPages
    };
  }

  async create(data: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>): Promise<LeaveRequest> {
    const id = generateULID();
    return await this.leaveRequestRepository.create({ ...data, id });
  }

  async update(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return await this.leaveRequestRepository.update(id, data);
  }

  async delete(id: string): Promise<LeaveRequest> {
    return await this.leaveRequestRepository.delete(id);
  }
}

let leaveRequestService: LeaveRequestService;

export function getLeaveRequestService(): LeaveRequestService {
  if (!leaveRequestService) {
    leaveRequestService = new LeaveRequestService();
  }
  return leaveRequestService;
}
