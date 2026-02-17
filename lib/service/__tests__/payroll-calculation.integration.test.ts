import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollCalculationService } from '../payroll-calculation.service';
import { prisma } from '@/lib/db';

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
    employeeHolidayAssignment: {
      findFirst: vi.fn(),
    },
    taxBracket: {
      findFirst: vi.fn(),
    },
    philhealthContribution: {
      findFirst: vi.fn(),
    },
    sSSContribution: {
      findFirst: vi.fn(),
    },
    pagibigContribution: {
      findFirst: vi.fn(),
    },
  },
}));

describe('PayrollCalculationService Integration Tests', () => {
  let service: PayrollCalculationService;
  const mockEmployeeId = 'emp-123';
  const mockOrganizationId = 'org-123';
  const mockDepartmentId = 'dept-123';

  beforeEach(() => {
    service = new PayrollCalculationService();
    vi.clearAllMocks();
  });

  describe('Full Payroll Calculation with PH Deductions', () => {
    it('should calculate complete payroll with all PH deductions', async () => {
      // Mock employee
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: mockEmployeeId,
        firstName: 'John',
        lastName: 'Doe',
        organizationId: mockOrganizationId,
        departmentId: mockDepartmentId,
        calendar: { id: 'cal-123' },
        organization: { id: mockOrganizationId },
      });

      // Mock holidays (none for this period)
      (prisma.holiday.findMany as any).mockResolvedValue([]);

      // Mock time entries (5 days of work)
      const mockTimeEntries = [
        {
          id: 'te-1',
          clock_in_at: '2024-01-01T09:00:00Z',
          clock_out_at: '2024-01-01T17:00:00Z',
          date: new Date('2024-01-01'),
        },
        {
          id: 'te-2',
          clock_in_at: '2024-01-02T09:00:00Z',
          clock_out_at: '2024-01-02T17:00:00Z',
          date: new Date('2024-01-02'),
        },
        {
          id: 'te-3',
          clock_in_at: '2024-01-03T09:00:00Z',
          clock_out_at: '2024-01-03T17:00:00Z',
          date: new Date('2024-01-03'),
        },
        {
          id: 'te-4',
          clock_in_at: '2024-01-04T09:00:00Z',
          clock_out_at: '2024-01-04T17:00:00Z',
          date: new Date('2024-01-04'),
        },
        {
          id: 'te-5',
          clock_in_at: '2024-01-05T09:00:00Z',
          clock_out_at: '2024-01-05T17:00:00Z',
          date: new Date('2024-01-05'),
        },
      ];
      (prisma.timeEntry.findMany as any).mockResolvedValue(mockTimeEntries);

      // Mock overtime requests (none)
      (prisma.overtime.findFirst as any).mockResolvedValue(null);

      // Mock payroll rules
      (prisma.payrollRule.findFirst as any).mockResolvedValue({
        multiplier: 1.0,
        appliesTo: 'REGULAR',
      });

      // Mock government contribution rates
      (prisma.taxBracket.findFirst as any).mockResolvedValue({
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      });

      (prisma.philhealthContribution.findFirst as any).mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      });

      (prisma.sSSContribution.findFirst as any).mockResolvedValue({
        id: '5',
        minSalary: 10000,
        maxSalary: 12499.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      });

      (prisma.pagibigContribution.findFirst as any).mockResolvedValue({
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      });

      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-05');

      const result = await service.computePayroll(mockEmployeeId, dateFrom, dateTo);

      // Verify payroll calculation structure
      expect(result).toHaveProperty('employeeId', mockEmployeeId);
      expect(result).toHaveProperty('period_start', dateFrom);
      expect(result).toHaveProperty('period_end', dateTo);
      expect(result).toHaveProperty('total_gross_pay');
      expect(result).toHaveProperty('total_net_pay');
      expect(result).toHaveProperty('taxable_income');
      expect(result).toHaveProperty('government_deductions');

      // Verify government deductions
      expect(result.government_deductions).toEqual({
        tax: expect.any(Number),
        philhealth: expect.any(Number),
        sss: expect.any(Number),
        pagibig: expect.any(Number),
        total: expect.any(Number),
      });

      // Verify net pay calculation
      expect(result.total_net_pay).toBe(
        result.total_gross_pay - result.government_deductions.total
      );

      // Verify taxable income
      expect(result.taxable_income).toBe(
        result.total_gross_pay - 
        result.government_deductions.philhealth - 
        result.government_deductions.sss - 
        result.government_deductions.pagibig
      );
    });

    it('should handle payroll with overtime', async () => {
      // Mock employee
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: mockEmployeeId,
        organizationId: mockOrganizationId,
        calendar: { id: 'cal-123' },
        organization: { id: mockOrganizationId },
      });

      // Mock holidays
      (prisma.holiday.findMany as any).mockResolvedValue([]);

      // Mock time entries with overtime
      (prisma.timeEntry.findMany as any).mockResolvedValue([
        {
          id: 'te-1',
          clock_in_at: '2024-01-01T09:00:00Z',
          clock_out_at: '2024-01-01T19:00:00Z', // 10 hours
          date: new Date('2024-01-01'),
        },
      ]);

      // Mock overtime request (2 hours approved)
      (prisma.overtimeRequest.findFirst as any).mockResolvedValue({
        approvedMinutes: 120,
      });

      // Mock payroll rules
      (prisma.payrollRule.findFirst as any).mockResolvedValue({
        multiplier: 1.0,
        appliesTo: 'REGULAR',
      });

      // Mock government rates
      (prisma.taxBracket.findFirst as any).mockResolvedValue({
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      });

      (prisma.philhealthContribution.findFirst as any).mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      });

      (prisma.sSSContribution.findFirst as any).mockResolvedValue({
        id: '5',
        minSalary: 10000,
        maxSalary: 12499.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      });

      (prisma.pagibigContribution.findFirst as any).mockResolvedValue({
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      });

      const result = await service.computePayroll(
        mockEmployeeId,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      // Should include overtime pay
      expect(result.total_overtime_pay).toBeGreaterThan(0);
      expect(result.total_overtime_minutes).toBe(120);

      // Gross pay should include overtime
      expect(result.total_gross_pay).toBeGreaterThan(result.total_regular_pay);

      // Deductions should be calculated on total gross pay
      expect(result.government_deductions.total).toBeGreaterThan(0);
    });

    it('should handle payroll with holidays', async () => {
      // Mock employee
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: mockEmployeeId,
        organizationId: mockOrganizationId,
        calendar: { id: 'cal-123' },
        organization: { id: mockOrganizationId },
      });

      // Mock holiday
      (prisma.holiday.findMany as any).mockResolvedValue([
        {
          id: 'h-1',
          name: 'New Year',
          date: new Date('2024-01-01'),
          type: 'REGULAR_HOLIDAY',
          isRecurring: false,
        },
      ]);

      // Mock time entry on holiday
      (prisma.timeEntry.findMany as any).mockResolvedValue([
        {
          id: 'te-1',
          clock_in_at: '2024-01-01T09:00:00Z',
          clock_out_at: '2024-01-01T17:00:00Z',
          date: new Date('2024-01-01'),
        },
      ]);

      (prisma.overtimeRequest.findFirst as any).mockResolvedValue(null);

      // Mock holiday pay rule (double pay)
      (prisma.payrollRule.findFirst as any).mockResolvedValue({
        multiplier: 2.0,
        appliesTo: 'REGULAR',
      });

      // Mock government rates
      (prisma.taxBracket.findFirst as any).mockResolvedValue({
        id: '2',
        minSalary: 20833,
        maxSalary: 33333,
        baseTax: 0,
        rate: 0.20,
      });

      (prisma.philhealthContribution.findFirst as any).mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.0275,
        employerRate: 0.0275,
      });

      (prisma.sSSContribution.findFirst as any).mockResolvedValue({
        id: '5',
        minSalary: 10000,
        maxSalary: 12499.99,
        employeeRate: 0.045,
        employerRate: 0.135,
        ecRate: 0.01,
      });

      (prisma.pagibigContribution.findFirst as any).mockResolvedValue({
        id: '2',
        minSalary: 5000.01,
        maxSalary: null,
        employeeRate: 0.02,
        employerRate: 0.02,
      });

      const result = await service.computePayroll(
        mockEmployeeId,
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      // Should have holiday pay
      expect(result.total_regular_pay).toBeGreaterThan(0);

      // Deductions calculated on holiday pay
      expect(result.government_deductions.total).toBeGreaterThan(0);
    });
  });

  describe('Rate Transitions', () => {
    it('should use correct rates based on effective date', async () => {
      // Mock employee
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: mockEmployeeId,
        organizationId: mockOrganizationId,
        calendar: { id: 'cal-123' },
        organization: { id: mockOrganizationId },
      });

      // Mock old rates (effective before 2024-06-01)
      const oldDate = new Date('2024-05-31');
      (prisma.taxBracket.findFirst as any).mockImplementation((args: any) => {
        if (args.where.effectiveFrom.lte.getTime() <= oldDate.getTime()) {
          return Promise.resolve({
            id: 'old',
            minSalary: 20833,
            maxSalary: 33333,
            baseTax: 0,
            rate: 0.15, // Lower rate
          });
        }
        return Promise.resolve(null);
      });

      // Mock other rates
      (prisma.philhealthContribution.findFirst as any).mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: null,
        employeeRate: 0.025,
        employerRate: 0.025,
      });

      (prisma.sSSContribution.findFirst as any).mockResolvedValue({
        id: '1',
        minSalary: 2000,
        maxSalary: 2249.99,
        employeeRate: 0.04,
        employerRate: 0.12,
        ecRate: 0.01,
      });

      (prisma.pagibigContribution.findFirst as any).mockResolvedValue({
        id: '1',
        minSalary: 0,
        maxSalary: 5000,
        employeeRate: 0.01,
        employerRate: 0.02,
      });

      // Mock time entries
      (prisma.timeEntry.findMany as any).mockResolvedValue([
        {
          id: 'te-1',
          clock_in_at: '2024-05-31T09:00:00Z',
          clock_out_at: '2024-05-31T17:00:00Z',
          date: new Date('2024-05-31'),
        },
      ]);

      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.overtimeRequest.findFirst as any).mockResolvedValue(null);
      (prisma.payrollRule.findFirst as any).mockResolvedValue({
        multiplier: 1.0,
        appliesTo: 'REGULAR',
      });

      const result = await service.computePayroll(
        mockEmployeeId,
        new Date('2024-05-31'),
        new Date('2024-05-31')
      );

      // Should use old rates
      expect(result.government_deductions.philhealth).toBeCloseTo(100, 2); // 4000 * 0.025
      expect(result.government_deductions.sss).toBeCloseTo(160, 2); // 4000 * 0.04
    });
  });

  describe('Error Handling', () => {
    it('should handle missing employee gracefully', async () => {
      (prisma.employee.findUnique as any).mockResolvedValue(null);

      await expect(
        service.computePayroll(
          mockEmployeeId,
          new Date('2024-01-01'),
          new Date('2024-01-05')
        )
      ).rejects.toThrow('Employee not found');
    });

    it('should handle missing government rates', async () => {
      // Mock employee
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: mockEmployeeId,
        organizationId: mockOrganizationId,
        calendar: { id: 'cal-123' },
        organization: { id: mockOrganizationId },
      });

      // Mock time entries
      (prisma.timeEntry.findMany as any).mockResolvedValue([
        {
          id: 'te-1',
          clock_in_at: '2024-01-01T09:00:00Z',
          clock_out_at: '2024-01-01T17:00:00Z',
          date: new Date('2024-01-01'),
        },
      ]);

      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.overtimeRequest.findFirst as any).mockResolvedValue(null);
      (prisma.payrollRule.findFirst as any).mockResolvedValue({
        multiplier: 1.0,
        appliesTo: 'REGULAR',
      });

      // Missing tax bracket
      (prisma.taxBracket.findFirst as any).mockResolvedValue(null);

      await expect(
        service.computePayroll(
          mockEmployeeId,
          new Date('2024-01-01'),
          new Date('2024-01-01')
        )
      ).rejects.toThrow('No tax bracket found for the given income');
    });
  });
});
