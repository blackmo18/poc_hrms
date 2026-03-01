import { overtimeRequestController } from '@/lib/controllers/overtime-request.controller';
import { timeEntryController } from '@/lib/controllers/time-entry.controller';
import { OvertimeRequestStatus } from '@/lib/models/overtime-request';
import { TimeEntryStatus } from '@/lib/models/time-entry';
import { IOvertimeRequestService } from '@/lib/interfaces/overtime-request.interface';

export class OvertimeRequestService implements IOvertimeRequestService {
  /**
   * Submit overtime request with validation
   */
  async submitOvertimeRequest(data: {
    employee_id: string;
    organizationId: string;
    work_date: Date;
    requested_minutes: number;
    reason?: string;
    created_by?: string;
  }): Promise<any> {
    try {
      // Get the closed time entry for this employee on this work date
      const timeEntryResult = await timeEntryController.getAll({
        employeeId: data.employee_id,
        status: TimeEntryStatus.CLOSED,
        dateFrom: data.work_date,
        dateTo: data.work_date,
      });

      if (!timeEntryResult.data || timeEntryResult.data.length === 0) {
        throw new Error('No closed timesheet found for this day.');
      }

      const timeEntry = timeEntryResult.data[0];

      // Calculate raw worked minutes (clock out - clock in - unpaid breaks)
      const rawWorkedMinutes = this.calculateRawWorkedMinutes(timeEntry);

      // Validate that requested minutes don't exceed actual worked minutes minus regular hours (480 minutes = 8 hours)
      const regularWorkMinutes = 480;
      if (data.requested_minutes > (rawWorkedMinutes - regularWorkMinutes)) {
        throw new Error('Requested OT exceeds actual worked minutes.');
      }

      // Create the overtime request
      const overtimeRequest = await overtimeRequestController.create({
        employeeId: data.employee_id,
        organizationId: data.organizationId,
        workDate: data.work_date,
        requestedMinutes: data.requested_minutes,
        reason: data.reason,
      });

      return {
        success: true,
        message: 'OT request submitted.',
        data: overtimeRequest,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve overtime request with validation
   */
  async approveOvertimeRequest(
    id: string,
    approvedMinutes: number,
    approvedByUserId: string,
    updatedBy?: string
  ): Promise<any> {
    try {
      // Get the overtime request to validate
      const overtimeRequest = await overtimeRequestController.getById(id);

      if (!overtimeRequest) {
        throw new Error('Overtime request not found.');
      }

      if (overtimeRequest.status !== OvertimeRequestStatus.PENDING) {
        throw new Error('Only pending requests can be approved.');
      }

      // Validate approved minutes don't exceed requested minutes
      if (approvedMinutes > overtimeRequest.requestedMinutes) {
        throw new Error('Approved minutes cannot exceed requested minutes.');
      }

      // Approve the request
      const updatedRequest = await overtimeRequestController.approve(
        id,
        approvedMinutes,
        approvedByUserId,
        updatedBy
      );

      return {
        success: true,
        message: 'Overtime request approved.',
        data: updatedRequest,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject overtime request
   */
  async rejectOvertimeRequest(id: string, updatedBy?: string): Promise<any> {
    try {
      const overtimeRequest = await overtimeRequestController.getById(id);

      if (!overtimeRequest) {
        throw new Error('Overtime request not found.');
      }

      if (overtimeRequest.status !== OvertimeRequestStatus.PENDING) {
        throw new Error('Only pending requests can be rejected.');
      }

      const updatedRequest = await overtimeRequestController.reject(id, updatedBy);

      return {
        success: true,
        message: 'Overtime request rejected.',
        data: updatedRequest,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel overtime request
   */
  async cancelOvertimeRequest(id: string, updatedBy?: string): Promise<any> {
    try {
      const overtimeRequest = await overtimeRequestController.getById(id);

      if (!overtimeRequest) {
        throw new Error('Overtime request not found.');
      }

      if (overtimeRequest.status !== OvertimeRequestStatus.PENDING) {
        throw new Error('Only pending requests can be cancelled.');
      }

      const updatedRequest = await overtimeRequestController.cancel(id, updatedBy);

      return {
        success: true,
        message: 'Overtime request cancelled.',
        data: updatedRequest,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get overtime request by ID
   */
  async getById(id: string) {
    return await overtimeRequestController.getById(id);
  }

  /**
   * Get overtime requests with filters
   */
  async getAll(filters: any, options?: { page?: number; limit?: number }) {
    return await overtimeRequestController.getAll(filters, options);
  }

  /**
   * Get pending requests for approval
   */
  async getPendingRequests(organizationId?: string, options?: { page?: number; limit?: number }) {
    return await overtimeRequestController.getPendingRequests(organizationId, options);
  }

  /**
   * Get payable overtime minutes for an employee on a specific date
   */
  async getPayableOvertimeMinutes(employeeId: string, workDate: Date): Promise<number> {
    return await overtimeRequestController.getPayableOvertimeMinutes(employeeId, workDate);
  }

  /**
   * Approve overtime request (alias for approveOvertimeRequest)
   */
  async approve(
    id: string,
    approvedMinutes: number,
    approvedByUserId: string,
    updatedBy?: string
  ): Promise<any> {
    return await this.approveOvertimeRequest(id, approvedMinutes, approvedByUserId, updatedBy);
  }

  /**
   * Reject overtime request (alias for rejectOvertimeRequest)
   */
  async reject(id: string, updatedBy?: string): Promise<any> {
    return await this.rejectOvertimeRequest(id, updatedBy);
  }

  /**
   * Calculate raw worked minutes from time entry (clock out - clock in - unpaid breaks)
   */
  private calculateRawWorkedMinutes(timeEntry: any): number {
    if (!timeEntry.clock_in_at || !timeEntry.clock_out_at) {
      return 0;
    }

    const workedMs = timeEntry.clock_out_at.getTime() - timeEntry.clock_in_at.getTime();
    const workedMinutes = Math.floor(workedMs / (1000 * 60));

    // TODO: Subtract unpaid break minutes when break functionality is implemented
    // For now, return raw worked minutes
    return workedMinutes;
  }
}

export const overtimeRequestService: IOvertimeRequestService = new OvertimeRequestService();
