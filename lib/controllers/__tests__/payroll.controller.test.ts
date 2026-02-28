import { describe, it, expect, vi, beforeEach } from 'vitest';
import { payrollController } from '../payroll.controller';
import { prisma } from '../../db';
import { PayrollStatus } from '@prisma/client';

// Helper function to create mock payroll objects
const createMockPayroll = (overrides: Partial<any> = {}) => ({
  id: 'payroll-1',
  employeeId: 'emp-1',
  organizationId: 'org-123',
  departmentId: 'dept-456',
  processedAt: new Date(),
  periodStart: new Date('2026-02-15T16:00:00.000Z'),
  periodEnd: new Date('2026-02-27T16:00:00.000Z'),
  status: 'COMPUTED' as PayrollStatus,
  taxDeduction: 1000,
  philhealthDeduction: 500,
  sssDeduction: 800,
  pagibigDeduction: 200,
  totalDeductions: 2500,
  grossPay: 20000,
  netPay: 17500,
  taxableIncome: 18000,
  approvedAt: null,
  approvedBy: null,
  releasedAt: null,
  releasedBy: null,
  voidedAt: null,
  voidedBy: null,
  voidReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  employee: {
    id: 'emp-1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    department: {
      name: 'Engineering'
    }
  },
  deductions: [
    { id: 'ded-1', type: 'TAX', amount: 1000 },
    { id: 'ded-2', type: 'SSS', amount: 800 }
  ],
  ...overrides
});

// Mock prisma
vi.mock('../../db', () => ({
  prisma: {
    payroll: {
      findMany: vi.fn(),
    },
  },
}));

describe('PayrollController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPayrollsByOrganizationAndPeriod', () => {
    const mockOrganizationId = 'org-123';
    const mockDepartmentId = 'dept-456';
    const mockPeriodStart = new Date('2026-02-16');
    const mockPeriodEnd = new Date('2026-02-28');

    it('should call prisma.payroll.findMany with correct overlapping period query', async () => {
      const mockPayrolls = [
        createMockPayroll({
          id: 'payroll-1',
          employeeId: 'emp-1',
          periodStart: new Date('2026-02-15T16:00:00.000Z'),
          periodEnd: new Date('2026-02-27T16:00:00.000Z'),
        }),
        createMockPayroll({
          id: 'payroll-2',
          employeeId: 'emp-2',
          periodStart: new Date('2026-02-20T00:00:00.000Z'),
          periodEnd: new Date('2026-03-05T00:00:00.000Z'),
          status: 'APPROVED',
        }),
      ];

      vi.mocked(prisma.payroll.findMany).mockResolvedValue(mockPayrolls);

      const result = await payrollController.getPayrollsByOrganizationAndPeriod(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(prisma.payroll.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrganizationId,
          departmentId: mockDepartmentId,
          AND: [
            {
              periodStart: {
                lte: mockPeriodEnd,
              },
            },
            {
              periodEnd: {
                gte: mockPeriodStart,
              },
            },
          ],
        },
        select: expect.any(Object),
        orderBy: {
          processedAt: 'desc',
        },
      });

      expect(result).toEqual(mockPayrolls);
    });

    it('should include payrolls that overlap with the filter period', async () => {
      // Payroll that starts before filter but ends within filter
      const overlappingPayroll1 = createMockPayroll({
        id: 'payroll-1',
        periodStart: new Date('2026-02-10T00:00:00.000Z'),
        periodEnd: new Date('2026-02-20T00:00:00.000Z'),
      });

      // Payroll that starts within filter but ends after filter
      const overlappingPayroll2 = createMockPayroll({
        id: 'payroll-2',
        periodStart: new Date('2026-02-20T00:00:00.000Z'),
        periodEnd: new Date('2026-03-05T00:00:00.000Z'),
        status: 'APPROVED',
      });

      // Payroll completely within filter
      const overlappingPayroll3 = createMockPayroll({
        id: 'payroll-3',
        periodStart: new Date('2026-02-18T00:00:00.000Z'),
        periodEnd: new Date('2026-02-25T00:00:00.000Z'),
        status: 'DRAFT',
      });

      vi.mocked(prisma.payroll.findMany).mockResolvedValue([
        overlappingPayroll1,
        overlappingPayroll2,
        overlappingPayroll3,
      ]);

      const result = await payrollController.getPayrollsByOrganizationAndPeriod(
        mockOrganizationId,
        undefined,
        mockPeriodStart,
        mockPeriodEnd
      );

      // Should only return overlapping payrolls
      expect(result).toHaveLength(3);
      expect(result.map(p => p.id)).toEqual(['payroll-1', 'payroll-2', 'payroll-3']);
    });

    it('should work without department filter', async () => {
      vi.mocked(prisma.payroll.findMany).mockResolvedValue([]);

      await payrollController.getPayrollsByOrganizationAndPeriod(
        mockOrganizationId,
        undefined,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(prisma.payroll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrganizationId,
            // departmentId should not be present in the query when undefined
            AND: expect.any(Array),
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(prisma.payroll.findMany).mockResolvedValue([]);

      const result = await payrollController.getPayrollsByOrganizationAndPeriod(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result).toEqual([]);
      expect(prisma.payroll.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
