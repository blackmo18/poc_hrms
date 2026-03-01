import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateActualAbsentDays, calculateLateMetrics } from '../payroll-calculations';

// Mock dependencies
vi.mock('../../service/time-entry.service', () => ({
  timeEntryService: {
    getByEmployeeAndDateRange: vi.fn(),
  },
}));

vi.mock('../../service/work-schedule.service', () => ({
  getWorkScheduleService: vi.fn(),
}));

vi.mock('../../service/leave-request.service', () => ({
  getLeaveRequestService: vi.fn(),
}));

vi.mock('../../service/late-deduction-policy.service', () => ({
  getLateDeductionPolicyService: vi.fn(),
}));

vi.mock('./logger', () => ({
  logInfo: vi.fn(),
}));

describe('Payroll Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateActualAbsentDays', () => {
    it('should calculate 0 absent days when all weekdays have time entries', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getLeaveRequestService } = await import('../../service/leave-request.service');

      // Mock time entries for all weekdays
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() },
        { id: '2', workDate: new Date('2026-02-24'), clockOutAt: new Date() },
        { id: '3', workDate: new Date('2026-02-25'), clockOutAt: new Date() },
        { id: '4', workDate: new Date('2026-02-26'), clockOutAt: new Date() },
        { id: '5', workDate: new Date('2026-02-27'), clockOutAt: new Date() },
      ]);

      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Act
      const result = await calculateActualAbsentDays(employeeId, periodStart, periodEnd);

      // Assert
      expect(result).toBe(0);
    });

    it('should calculate absent days for weekdays without time entries', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getLeaveRequestService } = await import('../../service/leave-request.service');

      // Mock time entries for only 3 days (Mon, Tue, Thu)
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() }, // Monday
        { id: '2', workDate: new Date('2026-02-24'), clockOutAt: new Date() }, // Tuesday
        { id: '3', workDate: new Date('2026-02-26'), clockOutAt: new Date() }, // Thursday
      ]);

      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Act
      const result = await calculateActualAbsentDays(employeeId, periodStart, periodEnd);

      // Assert - Should be 2 absent days (Wednesday and Friday)
      expect(result).toBe(2);
    });

    it('should exclude absent days covered by approved leave', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getLeaveRequestService } = await import('../../service/leave-request.service');

      // Mock time entries for only 3 days (Mon, Tue, Thu)
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() }, // Monday
        { id: '2', workDate: new Date('2026-02-24'), clockOutAt: new Date() }, // Tuesday
        { id: '3', workDate: new Date('2026-02-26'), clockOutAt: new Date() }, // Thursday
      ]);

      // Mock approved leave for Wednesday
      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([
          {
            id: 'leave-001',
            startDate: new Date('2026-02-25'), // Wednesday
            endDate: new Date('2026-02-25'), // Wednesday
          },
        ]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Act
      const result = await calculateActualAbsentDays(employeeId, periodStart, periodEnd);

      // Assert - Should be 1 absent day (only Friday, Wednesday is covered by leave)
      expect(result).toBe(1);
    });

    it('should handle multi-day approved leave', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getLeaveRequestService } = await import('../../service/leave-request.service');

      // Mock time entries for only Monday
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() }, // Monday
      ]);

      // Mock approved leave for Tuesday to Thursday
      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([
          {
            id: 'leave-001',
            startDate: new Date('2026-02-24'), // Tuesday
            endDate: new Date('2026-02-26'), // Thursday
          },
        ]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Act
      const result = await calculateActualAbsentDays(employeeId, periodStart, periodEnd);

      // Assert - Should be 1 absent day (only Friday, Tue-Thu covered by leave)
      expect(result).toBe(1);
    });

    it('should ignore time entries with null clockOutAt', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getLeaveRequestService } = await import('../../service/leave-request.service');

      // Mock time entries with null clockOutAt (incomplete entries)
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: null }, // Incomplete
        { id: '2', workDate: new Date('2026-02-24'), clockOutAt: new Date() }, // Complete
      ]);

      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Act
      const result = await calculateActualAbsentDays(employeeId, periodStart, periodEnd);

      // Assert - Should be 4 absent days (Mon incomplete, Wed-Fri missing)
      expect(result).toBe(4);
    });

    it('should handle periods spanning weekends', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-03-01'); // Sunday

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getLeaveRequestService } = await import('../../service/leave-request.service');

      // Mock time entries for weekdays only
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() }, // Monday
        { id: '2', workDate: new Date('2026-02-24'), clockOutAt: new Date() }, // Tuesday
        { id: '3', workDate: new Date('2026-02-25'), clockOutAt: new Date() }, // Wednesday
        { id: '4', workDate: new Date('2026-02-26'), clockOutAt: new Date() }, // Thursday
        { id: '5', workDate: new Date('2026-02-27'), clockOutAt: new Date() }, // Friday
      ]);

      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Act
      const result = await calculateActualAbsentDays(employeeId, periodStart, periodEnd);

      // Assert - Should be 0 absent days (weekends are excluded)
      expect(result).toBe(0);
    });
  });

  describe('calculateLateMetrics', () => {
    beforeEach(() => {
      // Set environment variables for testing
      process.env.PAYROLL_DAYS_PER_MONTH = '22';
      process.env.PAYROLL_HOURS_PER_DAY = '8';
    });

    it('should calculate late minutes and instances', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const organizationId = 'org-001';
      const periodStart = new Date('2026-02-23');
      const periodEnd = new Date('2026-02-27');
      const compensation = { baseSalary: 22000 };

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getWorkScheduleService } = await import('../../service/work-schedule.service');
      const { getLateDeductionPolicyService } = await import('../../service/late-deduction-policy.service');

      // Mock work schedule
      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
          allowLateDeduction: true,
        }),
        validateTimeEntry: vi.fn().mockResolvedValue({
          isValid: true,
          lateMinutes: 30,
          undertimeMinutes: 0,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Mock time entries
      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        {
          id: 'entry-001',
          workDate: new Date('2026-02-23'),
          clockInAt: new Date('2026-02-23T09:30:00Z'),
          clockOutAt: new Date('2026-02-23T18:00:00Z'),
        },
        {
          id: 'entry-002',
          workDate: new Date('2026-02-24'),
          clockInAt: new Date('2026-02-24T09:15:00Z'),
          clockOutAt: new Date('2026-02-24T18:00:00Z'),
        },
      ]);

      // Mock late deduction policy
      const mockLateDeductionPolicyService = {
        calculateDeduction: vi.fn().mockResolvedValue(100), // $100 deduction
      };
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

      // Act
      const result = await calculateLateMetrics(employeeId, organizationId, periodStart, periodEnd, compensation);

      // Assert
      expect(result.totalMinutes).toBe(60); // 30 + 30 minutes for both entries
      expect(result.instances).toBe(2); // Both entries have deductions
      expect(mockLateDeductionPolicyService.calculateDeduction).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when work schedule does not allow late deduction', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const organizationId = 'org-001';
      const periodStart = new Date('2026-02-23');
      const periodEnd = new Date('2026-02-27');
      const compensation = { baseSalary: 22000 };

      const { getWorkScheduleService } = await import('../../service/work-schedule.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
          allowLateDeduction: false, // Late deduction not allowed
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Act
      const result = await calculateLateMetrics(employeeId, organizationId, periodStart, periodEnd, compensation);

      // Assert
      expect(result.totalMinutes).toBe(0);
      expect(result.instances).toBe(0);
    });

    it('should return 0 when no work schedule exists', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const organizationId = 'org-001';
      const periodStart = new Date('2026-02-23');
      const periodEnd = new Date('2026-02-27');
      const compensation = { baseSalary: 22000 };

      const { getWorkScheduleService } = await import('../../service/work-schedule.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue(null), // No schedule
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Act
      const result = await calculateLateMetrics(employeeId, organizationId, periodStart, periodEnd, compensation);

      // Assert
      expect(result.totalMinutes).toBe(0);
      expect(result.instances).toBe(0);
    });

    it('should use environment variables for rate calculations', async () => {
      // Arrange
      const employeeId = 'emp-001';
      const organizationId = 'org-001';
      const periodStart = new Date('2026-02-23');
      const periodEnd = new Date('2026-02-27');
      const compensation = { baseSalary: 22000 };

      const { timeEntryService } = await import('../../service/time-entry.service');
      const { getWorkScheduleService } = await import('../../service/work-schedule.service');
      const { getLateDeductionPolicyService } = await import('../../service/late-deduction-policy.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
          allowLateDeduction: true,
        }),
        validateTimeEntry: vi.fn().mockResolvedValue({
          isValid: true,
          lateMinutes: 30,
          undertimeMinutes: 0,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      (timeEntryService.getByEmployeeAndDateRange as any).mockResolvedValue([
        {
          id: 'entry-001',
          workDate: new Date('2026-02-23'),
          clockInAt: new Date('2026-02-23T09:30:00Z'),
          clockOutAt: new Date('2026-02-23T18:00:00Z'),
        },
      ]);

      const mockLateDeductionPolicyService = {
        calculateDeduction: vi.fn().mockResolvedValue(100),
      };
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

      // Act
      await calculateLateMetrics(employeeId, organizationId, periodStart, periodEnd, compensation);

      // Assert - Check that the calculation uses environment variables
      expect(mockLateDeductionPolicyService.calculateDeduction).toHaveBeenCalledWith(
        organizationId,
        'LATE',
        30,
        1000, // dailyRate = 22000 / 22
        125,  // hourlyRate = 1000 / 8
        expect.any(Date)
      );
    });
  });
});
