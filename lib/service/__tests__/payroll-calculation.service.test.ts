import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollCalculationService } from '../payroll-calculation.service';
import { PHDeductionsService } from '../ph-deductions.service';
import { getLateDeductionPolicyService } from '../late-deduction-policy.service';
import { getWorkScheduleService } from '../work-schedule.service';
import { timeEntryService } from '../time-entry.service';
import { prisma } from '@/lib/db';
import { DayType, HolidayType, PayComponent } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
    },
    holiday: {
      findMany: vi.fn(),
    },
    timeEntry: {
      findMany: vi.fn(),
    },
    overtime: {
      findFirst: vi.fn(),
    },
    payrollRule: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock dependencies
vi.mock('../late-deduction-policy.service', () => ({
  getLateDeductionPolicyService: vi.fn(),
}));

vi.mock('../work-schedule.service', () => ({
  getWorkScheduleService: vi.fn(),
}));

vi.mock('../time-entry.service', () => ({
  timeEntryService: {
    getByEmployeeAndDateRange: vi.fn(),
  },
}));

vi.mock('../leave-request.service', () => ({
  getLeaveRequestService: vi.fn(),
}));

describe('PayrollCalculationService', () => {
  let service: PayrollCalculationService;
  let mockPHDeductionsService: any;

  beforeEach(() => {
    mockPHDeductionsService = {
      calculateAllDeductions: vi.fn(),
    };
    service = new PayrollCalculationService(mockPHDeductionsService);
    vi.clearAllMocks();
  });

  describe('calculatePHDeductions', () => {
    it('should calculate PH government deductions', async () => {
      const organizationId = 'org-001';
      const grossPay = 25000;
      
      const mockDeductions = {
        tax: 833.40,
        sss: 1125.00,
        philhealth: 687.50,
        pagibig: 100.00,
        totalDeductions: 2745.90,
        taxableIncome: 23087.50,
      };

      mockPHDeductionsService.calculateAllDeductions.mockResolvedValue(mockDeductions);

      const result = await service.calculatePHDeductions(organizationId, grossPay);

      expect(result).toEqual(mockDeductions);
      expect(mockPHDeductionsService.calculateAllDeductions).toHaveBeenCalledWith(
        organizationId,
        grossPay
      );
    });
  });

  describe('calculateLateDeductions', () => {
    it('should calculate late deductions based on policies', async () => {
      const organizationId = 'org-001';
      const employeeId = 'emp-001';
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-15');
      const dailyRate = 1000;
      const hourlyRate = 125;

      // Mock the dependencies
      const mockLateDeductionPolicyService = {
        getByOrganizationId: vi.fn().mockResolvedValue({
          id: 'policy-001',
          organizationId,
          policyType: 'LATE',
          gracePeriodMinutes: 15,
          deductionPerMinute: 5,
          maxDeductionPerDay: 100,
          isActive: true,
        }),
        calculateDeduction: vi.fn().mockResolvedValue(50),
      };
      
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

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
      
      timeEntryService.getByEmployeeAndDateRange = vi.fn().mockResolvedValue([
        {
          id: 'entry-001',
          employeeId,
          workDate: new Date('2024-01-01'),
          clockInAt: new Date('2024-01-01T09:30:00Z'),
          clockOutAt: new Date('2024-01-01T18:00:00Z'),
        },
      ]);

      const result = await service.calculateLateDeductions(
        organizationId,
        employeeId,
        periodStart,
        periodEnd,
        dailyRate,
        hourlyRate
      );

      expect(result.totalDeduction).toBe(50);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].deduction).toBe(50);
    });

    it('should return 0 when no work schedule or late deduction not allowed', async () => {
      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue(null),
      };
      
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      const result = await service.calculateLateDeductions(
        'org-001',
        'emp-001',
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        1000,
        125
      );

      expect(result.totalDeduction).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });
  });

  describe('calculateAbsenceDeductions', () => {
    beforeEach(() => {
      // Set environment variables for testing
      process.env.PAYROLL_DAYS_PER_MONTH = '22';
      process.env.PAYROLL_HOURS_PER_DAY = '8';
    });

    it('should calculate absence deductions for days without time entries', async () => {
      // Arrange
      const organizationId = 'org-001';
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday
      const dailyRate = 1000;

      const { getWorkScheduleService } = await import('../work-schedule.service');
      const { getLeaveRequestService } = await import('../leave-request.service');

      // Mock work schedule
      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Mock time entries for only 3 days (Mon, Tue, Thu)
      timeEntryService.getByEmployeeAndDateRange = vi.fn().mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() }, // Monday
        { id: '2', workDate: new Date('2026-02-24'), clockOutAt: new Date() }, // Tuesday
        { id: '3', workDate: new Date('2026-02-26'), clockOutAt: new Date() }, // Thursday
      ]);

      // Mock no approved leave
      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Mock late deduction policy for absence calculation
      const mockLateDeductionPolicyService = {
        getPolicyByType: vi.fn().mockResolvedValue(null), // No specific policy
      };
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

      // Act
      const result = await service.calculateAbsenceDeductions(
        organizationId,
        employeeId,
        periodStart,
        periodEnd,
        dailyRate
      );

      // Assert - Should deduct for 2 absent days (Wednesday and Friday)
      expect(result.totalDeduction).toBe(2000);
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].deduction).toBe(1000);
      expect(result.breakdown[1].deduction).toBe(1000);
    });

    it('should exclude absent days covered by approved leave', async () => {
      // Arrange
      const organizationId = 'org-001';
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday
      const dailyRate = 1000;

      const { getWorkScheduleService } = await import('../work-schedule.service');
      const { getLeaveRequestService } = await import('../leave-request.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Mock time entries for only 3 days (Mon, Tue, Thu)
      timeEntryService.getByEmployeeAndDateRange = vi.fn().mockResolvedValue([
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

      const mockLateDeductionPolicyService = {
        getPolicyByType: vi.fn().mockResolvedValue(null),
      };
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

      // Act
      const result = await service.calculateAbsenceDeductions(
        organizationId,
        employeeId,
        periodStart,
        periodEnd,
        dailyRate
      );

      // Assert - Should deduct for only 1 absent day (Friday, Wednesday covered by leave)
      expect(result.totalDeduction).toBe(1000);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].deduction).toBe(1000);
    });

    it('should return 0 when all weekdays have time entries', async () => {
      // Arrange
      const organizationId = 'org-001';
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday
      const dailyRate = 1000;

      const { getWorkScheduleService } = await import('../work-schedule.service');
      const { getLeaveRequestService } = await import('../leave-request.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Mock time entries for all weekdays
      timeEntryService.getByEmployeeAndDateRange = vi.fn().mockResolvedValue([
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
      const result = await service.calculateAbsenceDeductions(
        organizationId,
        employeeId,
        periodStart,
        periodEnd,
        dailyRate
      );

      // Assert
      expect(result.totalDeduction).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });

    it('should apply fixed amount policy when available', async () => {
      // Arrange
      const organizationId = 'org-001';
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-02-27'); // Friday
      const dailyRate = 1000;

      const { getWorkScheduleService } = await import('../work-schedule.service');
      const { getLeaveRequestService } = await import('../leave-request.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Mock time entries for only Monday
      timeEntryService.getByEmployeeAndDateRange = vi.fn().mockResolvedValue([
        { id: '1', workDate: new Date('2026-02-23'), clockOutAt: new Date() }, // Monday
      ]);

      const mockLeaveRequestService = {
        getApprovedLeaveByEmployeeAndDateRange: vi.fn().mockResolvedValue([]),
      };
      (getLeaveRequestService as any).mockReturnValue(mockLeaveRequestService);

      // Mock fixed amount policy
      const mockLateDeductionPolicyService = {
        getPolicyByType: vi.fn().mockResolvedValue({
          id: 'policy-001',
          organizationId,
          policyType: 'LATE',
          deductionMethod: 'FIXED_AMOUNT',
          fixedAmount: 500, // $500 fixed deduction
        }),
      };
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

      // Act
      const result = await service.calculateAbsenceDeductions(
        organizationId,
        employeeId,
        periodStart,
        periodEnd,
        dailyRate
      );

      // Assert - Should use fixed amount instead of daily rate
      expect(result.totalDeduction).toBe(2000); // 4 days * $500
      expect(result.breakdown).toHaveLength(4);
      result.breakdown.forEach(breakdown => {
        expect(breakdown.deduction).toBe(500);
      });
    });

    it('should handle periods spanning weekends correctly', async () => {
      // Arrange
      const organizationId = 'org-001';
      const employeeId = 'emp-001';
      const periodStart = new Date('2026-02-23'); // Monday
      const periodEnd = new Date('2026-03-01'); // Sunday
      const dailyRate = 1000;

      const { getWorkScheduleService } = await import('../work-schedule.service');
      const { getLeaveRequestService } = await import('../leave-request.service');

      const mockWorkScheduleService = {
        getByEmployeeId: vi.fn().mockResolvedValue({
          id: 'schedule-001',
          employeeId,
        }),
      };
      (getWorkScheduleService as any).mockReturnValue(mockWorkScheduleService);

      // Mock time entries for all weekdays
      timeEntryService.getByEmployeeAndDateRange = vi.fn().mockResolvedValue([
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

      const mockLateDeductionPolicyService = {
        getPolicyByType: vi.fn().mockResolvedValue(null),
      };
      (getLateDeductionPolicyService as any).mockReturnValue(mockLateDeductionPolicyService);

      // Act
      const result = await service.calculateAbsenceDeductions(
        organizationId,
        employeeId,
        periodStart,
        periodEnd,
        dailyRate
      );

      // Assert - Should be 0 (weekends excluded, all weekdays have entries)
      expect(result.totalDeduction).toBe(0);
      expect(result.breakdown).toHaveLength(0);
    });
  });
});
