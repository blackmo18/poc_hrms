import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OvertimeService, CreateOvertimeRequestData } from '../overtime.service';
import { prisma } from '../../db';

// Mock prisma
vi.mock('../../db', () => ({
  prisma: {
    timeEntry: {
      findFirst: vi.fn(),
    },
    overtime: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../../db';

// Ensure mocks are properly typed
const mockPrisma = vi.mocked(prisma);

describe('OvertimeService', () => {
  let service: OvertimeService;

  beforeEach(() => {
    service = new OvertimeService();
    vi.clearAllMocks();
  });

  describe('createOvertimeRequest', () => {
    it('should create overtime request successfully', async () => {
      const mockData: CreateOvertimeRequestData = {
        employeeId: 'emp-123',
        organizationId: 'org-123',
        workDate: new Date('2024-01-01'),
        timeEntryId: 'entry-123',
        timeStart: '09:00',
        timeEnd: '17:00',
        otType: 'REGULAR_DAY',
        reason: 'Project deadline',
        remarks: 'Urgent work',
      };

      const mockTimeEntry = { id: 'entry-123' };
      const mockOvertime = {
        id: 'ot-123',
        ...mockData,
        status: 'PENDING',
        employee: { firstName: 'John', lastName: 'Doe', department: { name: 'IT' } },
      };

      (mockPrisma.timeEntry.findFirst as any).mockResolvedValue(mockTimeEntry);
      mockPrisma.overtime.create.mockResolvedValue(mockOvertime);

      const result = await service.createOvertimeRequest(mockData);

      expect(prisma.timeEntry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entry-123',
          employeeId: 'emp-123',
        },
      });

      expect(prisma.overtime.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          employeeId: 'emp-123',
          organizationId: 'org-123',
          workDate: new Date('2024-01-01'),
          timeEntryId: 'entry-123',
          timeStart: '09:00',
          timeEnd: '17:00',
          otType: 'REGULAR_DAY',
          requestedMinutes: 480,
          reason: 'Project deadline',
          remarks: 'Urgent work',
          status: 'PENDING',
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockOvertime);
    });

    it('should throw error if time entry does not belong to employee', async () => {
      const mockData: CreateOvertimeRequestData = {
        employeeId: 'emp-123',
        organizationId: 'org-123',
        workDate: new Date('2024-01-01'),
        timeEntryId: 'entry-123',
        otType: 'REGULAR_DAY',
        reason: 'Project deadline',
      };

      (prisma.timeEntry.findFirst as any).mockResolvedValue(null);

      await expect(service.createOvertimeRequest(mockData)).rejects.toThrow(
        'Time entry not found or does not belong to user'
      );

      expect(prisma.timeEntry.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entry-123',
          employeeId: 'emp-123',
        },
      });
    });

    it('should create overtime without time entry', async () => {
      const mockData: CreateOvertimeRequestData = {
        employeeId: 'emp-123',
        organizationId: 'org-123',
        workDate: new Date('2024-01-01'),
        otType: 'EMERGENCY',
        reason: 'Emergency work',
      };

      const mockOvertime = {
        id: 'ot-123',
        ...mockData,
        status: 'PENDING',
        employee: { firstName: 'John', lastName: 'Doe', department: { name: 'IT' } },
      };

      (prisma.overtime.create as any).mockResolvedValue(mockOvertime);

      const result = await service.createOvertimeRequest(mockData);

      expect(prisma.timeEntry.findFirst).not.toHaveBeenCalled();
      expect(prisma.overtime.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          employeeId: 'emp-123',
          organizationId: 'org-123',
          workDate: new Date('2024-01-01'),
          timeEntryId: null,
          timeStart: null,
          timeEnd: null,
          otType: 'EMERGENCY',
          requestedMinutes: 0,
          reason: 'Emergency work',
          remarks: null,
          status: 'PENDING',
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      });

      expect(result).toEqual(mockOvertime);
    });
  });

  describe('getOvertimeRequestsByEmployee', () => {
    it('should get overtime requests for employee', async () => {
      const mockRequests = [
        { id: 'ot-1', reason: 'Work 1' },
        { id: 'ot-2', reason: 'Work 2' },
      ];

      (prisma.overtime.findMany as any).mockResolvedValue(mockRequests);

      const result = await service.getOvertimeRequestsByEmployee('emp-123');

      expect(prisma.overtime.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp-123' },
        include: {
          approvedByUser: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockRequests);
    });
  });

  describe('getOvertimeRequestById', () => {
    it('should get overtime request by id', async () => {
      const mockRequest = { id: 'ot-123', reason: 'Work' };

      (prisma.overtime.findUnique as any).mockResolvedValue(mockRequest);

      const result = await service.getOvertimeRequestById('ot-123');

      expect(prisma.overtime.findUnique).toHaveBeenCalledWith({
        where: { id: 'ot-123' },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      expect(result).toEqual(mockRequest);
    });
  });
});
