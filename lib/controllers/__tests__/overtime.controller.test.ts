import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { OvertimeController } from '../overtime.controller';
import { overtimeService } from '../../service/overtime.service';

// Mock the service
vi.mock('../../service/overtime.service', () => ({
  overtimeService: {
    createOvertimeRequest: vi.fn(),
    getOvertimeRequestsByEmployee: vi.fn(),
    getOvertimeRequestById: vi.fn(),
  },
}));

describe('OvertimeController', () => {
  let controller: OvertimeController;

  beforeEach(() => {
    controller = new OvertimeController();
    vi.clearAllMocks();
  });

  describe('createOvertimeRequest', () => {
    it('should create overtime request successfully', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          workDate: '2024-01-01',
          timeEntryId: 'entry-123',
          timeStart: '09:00',
          timeEnd: '17:00',
          reason: 'Project deadline',
          otType: 'REGULAR_DAY',
          remarks: 'Urgent work',
        }),
      } as unknown as NextRequest;

      const mockOvertime = {
        id: 'ot-123',
        employeeId: 'emp-123',
        organizationId: 'org-123',
        workDate: '2024-01-01T00:00:00.000Z', // JSON serialized Date
        timeEntryId: 'entry-123',
        timeStart: '09:00',
        timeEnd: '17:00',
        otType: 'REGULAR_DAY',
        reason: 'Project deadline',
        remarks: 'Urgent work',
        status: 'PENDING',
        employee: { firstName: 'John', lastName: 'Doe', department: { name: 'IT' } },
      };

      (overtimeService.createOvertimeRequest as any).mockResolvedValue(mockOvertime);

      const result = await controller.createOvertimeRequest(mockRequest, 'emp-123', 'org-123');

      expect(mockRequest.json).toHaveBeenCalled();
      expect(overtimeService.createOvertimeRequest).toHaveBeenCalledWith({
        employeeId: 'emp-123',
        organizationId: 'org-123',
        workDate: new Date('2024-01-01'),
        timeEntryId: 'entry-123',
        timeStart: '09:00',
        timeEnd: '17:00',
        reason: 'Project deadline',
        otType: 'REGULAR_DAY',
        remarks: 'Urgent work',
      });

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data).toEqual({
        success: true,
        data: mockOvertime,
      });
    });

    it('should handle validation error', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          workDate: 'invalid-date',
          reason: '',
          otType: 'INVALID_TYPE',
        }),
      } as unknown as NextRequest;

      const result = await controller.createOvertimeRequest(mockRequest, 'emp-123', 'org-123');

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should handle service error for time entry', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          workDate: '2024-01-01',
          timeEntryId: 'invalid-entry',
          reason: 'Test',
          otType: 'REGULAR_DAY',
        }),
      } as unknown as NextRequest;

      (overtimeService.createOvertimeRequest as any).mockRejectedValue(
        new Error('Time entry not found or does not belong to user')
      );

      const result = await controller.createOvertimeRequest(mockRequest, 'emp-123', 'org-123');

      expect(result.status).toBe(404);
      const data = await result.json();
      expect(data.error).toBe('Time entry not found or does not belong to user');
    });

    it('should handle generic service error', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          workDate: '2024-01-01',
          reason: 'Test',
          otType: 'REGULAR_DAY',
        }),
      } as unknown as NextRequest;

      (overtimeService.createOvertimeRequest as any).mockRejectedValue(new Error('Database error'));

      const result = await controller.createOvertimeRequest(mockRequest, 'emp-123', 'org-123');

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('getOvertimeRequests', () => {
    it('should get overtime requests successfully', async () => {
      const mockRequests = [
        { id: 'ot-1', reason: 'Work 1' },
        { id: 'ot-2', reason: 'Work 2' },
      ];

      (overtimeService.getOvertimeRequestsByEmployee as any).mockResolvedValue(mockRequests);

      const result = await controller.getOvertimeRequests('emp-123');

      expect(overtimeService.getOvertimeRequestsByEmployee).toHaveBeenCalledWith('emp-123');

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data).toEqual({
        success: true,
        data: mockRequests,
      });
    });

    it('should handle service error', async () => {
      (overtimeService.getOvertimeRequestsByEmployee as any).mockRejectedValue(new Error('Database error'));

      const result = await controller.getOvertimeRequests('emp-123');

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('getOvertimeRequestById', () => {
    it('should get overtime request by id successfully', async () => {
      const mockRequest = { id: 'ot-123', reason: 'Work' };

      (overtimeService.getOvertimeRequestById as any).mockResolvedValue(mockRequest);

      const result = await controller.getOvertimeRequestById('ot-123');

      expect(overtimeService.getOvertimeRequestById).toHaveBeenCalledWith('ot-123');

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data).toEqual({
        success: true,
        data: mockRequest,
      });
    });

    it('should return 404 if not found', async () => {
      (overtimeService.getOvertimeRequestById as any).mockResolvedValue(null);

      const result = await controller.getOvertimeRequestById('ot-999');

      expect(result.status).toBe(404);
      const data = await result.json();
      expect(data.error).toBe('Overtime request not found');
    });

    it('should handle service error', async () => {
      (overtimeService.getOvertimeRequestById as any).mockRejectedValue(new Error('Database error'));

      const result = await controller.getOvertimeRequestById('ot-123');

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe('Internal server error');
    });
  });
});
