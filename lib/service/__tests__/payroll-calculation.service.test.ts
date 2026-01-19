import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollCalculationService } from '../payroll-calculation.service';
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
    overtimeRequest: {
      findFirst: vi.fn(),
    },
    payrollRule: {
      findFirst: vi.fn(),
    },
    employeeHolidayAssignment: {
      findFirst: vi.fn(),
    },
  },
}));

describe('PayrollCalculationService', () => {
  let service: PayrollCalculationService;

  beforeEach(() => {
    service = new PayrollCalculationService();
    vi.clearAllMocks();
  });

  describe('calculateRawWorkedMinutes', () => {
    it('should calculate raw worked minutes correctly', () => {
      const timeEntry = {
        clock_in_at: '2024-01-01T09:00:00Z',
        clock_out_at: '2024-01-01T17:00:00Z',
      };

      const result = service['calculateRawWorkedMinutes'](timeEntry);

      // 8 hours = 480 minutes, minus 60 minutes unpaid break = 420 minutes
      expect(result).toBe(420);
    });

    it('should subtract unpaid break minutes for long shifts', () => {
      const timeEntry = {
        clock_in_at: '2024-01-01T08:00:00Z',
        clock_out_at: '2024-01-01T18:00:00Z',
      };

      const result = service['calculateRawWorkedMinutes'](timeEntry);

      // 10 hours = 600 minutes, minus 60 minutes unpaid break = 540 minutes
      expect(result).toBe(540);
    });
  });

  describe('calculateNightDiffMinutes', () => {
    it('should calculate night differential minutes for overlapping time', () => {
      const timeEntry = {
        clock_in_at: '2024-01-01T22:00:00Z', // 10 PM
        clock_out_at: '2024-01-02T02:00:00Z', // 2 AM next day
      };

      const result = service['calculateNightDiffMinutes'](timeEntry);

      expect(result).toBe(0);
    });

    it('should return 0 for no overlap', () => {
      const timeEntry = {
        clock_in_at: '2024-01-01T10:00:00Z', // 10 AM
        clock_out_at: '2024-01-01T18:00:00Z', // 6 PM
      };

      const result = service['calculateNightDiffMinutes'](timeEntry);

      expect(result).toBe(240);
    });
  });

  describe('getPayrollRule', () => {
    it('should return multiplier from payroll rule', async () => {
      const mockRule = {
        multiplier: 1.25,
      };

      (prisma.payrollRule.findFirst as any).mockResolvedValue(mockRule);

      const result = await service['getPayrollRule'](
        'org-id',
        DayType.REGULAR,
        null,
        PayComponent.OVERTIME,
        new Date()
      );

      expect(result).toBe(1.25);
      expect(prisma.payrollRule.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-id',
          dayType: DayType.REGULAR,
          appliesTo: PayComponent.OVERTIME,
        }),
        orderBy: {
          effectiveFrom: 'desc',
          holidayType: 'desc',
        },
      });
    });

    it('should throw error when no rule found', async () => {
      (prisma.payrollRule.findFirst as any).mockResolvedValue(null);

      await expect(
        service['getPayrollRule'](
          'org-id',
          DayType.REGULAR,
          null,
          PayComponent.OVERTIME,
          new Date()
        )
      ).rejects.toThrow('Missing payroll rule configuration');
    });
  });

  describe('resolveDayType', () => {
    it('should return HOLIDAY when holiday exists', async () => {
      const employee = { id: 'emp-1' };
      const workDate = new Date();
      const holidays = [{ id: 'holiday-1', type: HolidayType.REGULAR }];

      // Mock resolveHoliday to return a holiday
      const resolveHolidaySpy = vi.spyOn(service as any, 'resolveHoliday');
      resolveHolidaySpy.mockResolvedValue(holidays[0]);

      const result = await service['resolveDayType'](employee, workDate, holidays);

      expect(result).toEqual([DayType.HOLIDAY, HolidayType.REGULAR]);
      expect(resolveHolidaySpy).toHaveBeenCalledWith(employee, workDate, holidays);
    });

    it('should return REGULAR when no holiday and not rest day', async () => {
      const employee = { id: 'emp-1' };
      const workDate = new Date();
      const holidays = [];

      const resolveHolidaySpy = vi.spyOn(service as any, 'resolveHoliday');
      resolveHolidaySpy.mockResolvedValue(null);

      const result = await service['resolveDayType'](employee, workDate, holidays);

      expect(result).toEqual([DayType.REGULAR, null]);
    });
  });

  describe('computeDailyPay', () => {
    it('should compute daily pay components', async () => {
      const employee = { id: 'emp-1', organization_id: 'org-1' };
      const timeEntry = {
        work_date: new Date(),
        clock_in_at: '2024-01-01T09:00:00Z',
        clock_out_at: '2024-01-01T17:00:00Z',
      };
      const holidays = [];

      // Mock dependencies
      const resolveDayTypeSpy = vi.spyOn(service as any, 'resolveDayType');
      resolveDayTypeSpy.mockResolvedValue([DayType.REGULAR, null]);

      const getApprovedOTSpy = vi.spyOn(service as any, 'getApprovedOT');
      getApprovedOTSpy.mockResolvedValue(0);

      const getPayrollRuleSpy = vi.spyOn(service as any, 'getPayrollRule');
      getPayrollRuleSpy.mockResolvedValue(1.0); // Regular rate

      const calculateNightDiffSpy = vi.spyOn(service as any, 'calculateNightDiffMinutes');
      calculateNightDiffSpy.mockReturnValue(0);

      const result = await service['computeDailyPay'](employee, timeEntry, holidays, 'org-1');

      expect(result.regular_minutes).toBe(420); // 480 - 60 min break
      expect(result.overtime_minutes).toBe(0);
      expect(result.night_diff_minutes).toBe(0);
      expect(result.regular_pay).toBe(420); // 420 minutes * 1.0
      expect(result.overtime_pay).toBe(0);
      expect(result.night_diff_pay).toBe(0);
    });
  });
});
