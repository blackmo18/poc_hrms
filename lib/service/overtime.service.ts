import { Overtime } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { OvertimeController, overtimeController } from '@/lib/controllers/overtime.controller';

export interface CreateOvertimeRequestData {
  employeeId: string;
  organizationId: string;
  workDate: Date;
  timeEntryId?: string | null;
  timeStart?: string | null;
  timeEnd?: string | null;
  otType: string;
  reason: string;
  remarks?: string | null;
}

export class OvertimeService {
  // Helper function to calculate minutes between two times
  private calculateRequestedMinutes(timeStart: string, timeEnd: string): number {
    const [startH, startM] = timeStart.split(':').map(Number);
    const [endH, endM] = timeEnd.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return endMinutes - startMinutes;
  }

  async createOvertimeRequest(data: CreateOvertimeRequestData): Promise<Overtime> {
    // Validate time entry if provided
    if (data.timeEntryId) {
      const timeEntry = await OvertimeController.validateTimeEntryOwnership(data.timeEntryId, data.employeeId);

      if (!timeEntry) {
        throw new Error('Time entry not found or does not belong to user');
      }
    }

    // Create overtime request
    const overtimeData = {
      id: generateULID(),
      employeeId: data.employeeId,
      organizationId: data.organizationId,
      workDate: data.workDate,
      timeEntryId: data.timeEntryId || null,
      timeStart: data.timeStart || null,
      timeEnd: data.timeEnd || null,
      otType: data.otType,
      requestedMinutes: data.timeStart && data.timeEnd ? this.calculateRequestedMinutes(data.timeStart, data.timeEnd) : 0,
      reason: data.reason,
      remarks: data.remarks || null,
      status: 'PENDING' as const,
    };

    const overtimeRequest = await OvertimeController.createOvertime(overtimeData);

    return overtimeRequest;
  }

  async getOvertimeRequestsByEmployee(employeeId: string): Promise<Overtime[]> {
    // This method is now called directly on the controller instance
    // The controller will handle the database query
    const overtimeRequests = await overtimeController.getOvertimeRequests(employeeId);
    // Extract data from response
    const response = await overtimeRequests.json();
    return response.success ? response.data : [];
  }

  async getOvertimeRequestById(id: string): Promise<Overtime | null> {
    // This method is now called directly on the controller instance
    const overtimeRequest = await overtimeController.getOvertimeRequestById(id);
    // Extract data from response
    const response = await overtimeRequest.json();
    return response.success ? response.data : null;
  }
}

export const overtimeService = new OvertimeService();
