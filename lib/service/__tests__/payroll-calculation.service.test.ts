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
});
