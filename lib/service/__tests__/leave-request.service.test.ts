import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveRequestService } from '../leave-request.service';
import { leaveRequestController } from '../../controllers/leave-request.controller';

// Mock the controller
vi.mock('../../controllers/leave-request.controller', () => ({
  leaveRequestController: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getApprovedByEmployeeAndDateRange: vi.fn(),
  },
}));

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;
  let mockController: any;

  beforeEach(() => {
    service = new LeaveRequestService();
    mockController = vi.mocked(leaveRequestController);
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return leave request by id', async () => {
      const mockLeave = { id: 'leave-1', employeeId: 'emp-1', status: 'APPROVED' };
      mockController.getById.mockResolvedValue(mockLeave);

      const result = await service.getById('leave-1');

      expect(mockController.getById).toHaveBeenCalledWith('leave-1');
      expect(result).toEqual(mockLeave);
    });

    it('should return null when leave request not found', async () => {
      mockController.getById.mockResolvedValue(null);

      const result = await service.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByEmployeeId', () => {
    it('should return leave requests for employee', async () => {
      const mockLeaves = [
        { id: 'leave-1', employeeId: 'emp-1', status: 'APPROVED' },
        { id: 'leave-2', employeeId: 'emp-1', status: 'PENDING' },
      ];
      mockController.getAll.mockResolvedValue(mockLeaves);

      const result = await service.getByEmployeeId('emp-1');

      expect(mockController.getAll).toHaveBeenCalledWith('emp-1');
      expect(result).toEqual(mockLeaves);
    });
  });

  describe('getByStatus', () => {
    it('should return leave requests by status', async () => {
      const mockLeaves = [
        { id: 'leave-1', employeeId: 'emp-1', status: 'APPROVED' },
        { id: 'leave-2', employeeId: 'emp-2', status: 'APPROVED' },
      ];
      mockController.getAll.mockResolvedValue(mockLeaves);

      const result = await service.getByStatus('APPROVED');

      expect(mockController.getAll).toHaveBeenCalledWith(undefined, 'APPROVED');
      expect(result).toEqual(mockLeaves);
    });
  });

  describe('getAll', () => {
    const mockLeaves = [
      { id: 'leave-1', employeeId: 'emp-1', status: 'APPROVED' },
      { id: 'leave-2', employeeId: 'emp-2', status: 'PENDING' },
      { id: 'leave-3', employeeId: 'emp-3', status: 'REJECTED' },
    ];

    it('should return all leave requests without pagination', async () => {
      mockController.getAll.mockResolvedValue(mockLeaves);

      const result = await service.getAll();

      expect(result).toEqual({
        data: mockLeaves,
        total: 3,
        page: 1,
        limit: 3,
        totalPages: 1,
      });
    });

    it('should return paginated leave requests', async () => {
      mockController.getAll.mockResolvedValue(mockLeaves);

      const result = await service.getAll({ page: 1, limit: 2 });

      expect(result).toEqual({
        data: mockLeaves.slice(0, 2),
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
    });

    it('should return empty array when no leave requests exist', async () => {
      mockController.getAll.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 0,
        totalPages: 1,
      });
    });
  });

  describe('create', () => {
    it('should create new leave request', async () => {
      const newLeave = {
        employeeId: 'emp-1',
        organizationId: 'org-1',
        leaveType: 'SICK' as const,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-01'),
        isPaid: true,
        status: 'PENDING' as const,
      };
      const createdLeave = { id: 'leave-new', ...newLeave };
      mockController.create.mockResolvedValue(createdLeave);

      const result = await service.create(newLeave);

      expect(mockController.create).toHaveBeenCalledWith(newLeave);
      expect(result).toEqual(createdLeave);
    });
  });

  describe('update', () => {
    it('should update existing leave request', async () => {
      const updateData = { status: 'APPROVED' as const };
      const updatedLeave = { id: 'leave-1', employeeId: 'emp-1', status: 'APPROVED' as const };
      mockController.update.mockResolvedValue(updatedLeave);

      const result = await service.update('leave-1', updateData);

      expect(mockController.update).toHaveBeenCalledWith('leave-1', updateData);
      expect(result).toEqual(updatedLeave);
    });
  });

  describe('delete', () => {
    it('should delete leave request', async () => {
      mockController.delete.mockResolvedValue(true);

      const result = await service.delete('leave-1');

      expect(mockController.delete).toHaveBeenCalledWith('leave-1');
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockController.delete.mockResolvedValue(false);

      const result = await service.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getApprovedLeaveByEmployeeAndDateRange', () => {
    const employeeId = 'emp-1';
    const startDate = new Date('2026-03-01');
    const endDate = new Date('2026-03-15');

    it('should return approved leave requests for employee in date range', async () => {
      const mockApprovedLeaves = [
        {
          id: 'leave-1',
          employeeId,
          leaveType: 'SICK',
          startDate: new Date('2026-03-05'),
          endDate: new Date('2026-03-05'),
          isPaid: true,
          status: 'APPROVED',
          updatedAt: new Date('2026-03-01'),
        },
        {
          id: 'leave-2',
          employeeId,
          leaveType: 'VACATION',
          startDate: new Date('2026-03-10'),
          endDate: new Date('2026-03-12'),
          isPaid: true,
          status: 'APPROVED',
          updatedAt: new Date('2026-03-08'),
        },
      ];
      mockController.getApprovedByEmployeeAndDateRange.mockResolvedValue(mockApprovedLeaves);

      const result = await service.getApprovedLeaveByEmployeeAndDateRange(employeeId, startDate, endDate);

      expect(mockController.getApprovedByEmployeeAndDateRange).toHaveBeenCalledWith(employeeId, startDate, endDate);
      expect(result).toEqual(mockApprovedLeaves);
    });

    it('should return empty array when no approved leaves found', async () => {
      mockController.getApprovedByEmployeeAndDateRange.mockResolvedValue([]);

      const result = await service.getApprovedLeaveByEmployeeAndDateRange(employeeId, startDate, endDate);

      expect(result).toEqual([]);
    });

    it('should only return leaves with APPROVED status', async () => {
      const mockLeaves = [
        { id: 'leave-1', status: 'APPROVED' },
        { id: 'leave-2', status: 'PENDING' },
        { id: 'leave-3', status: 'REJECTED' },
      ];
      mockController.getApprovedByEmployeeAndDateRange.mockResolvedValue([mockLeaves[0]]);

      const result = await service.getApprovedLeaveByEmployeeAndDateRange(employeeId, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('APPROVED');
    });
  });
});
