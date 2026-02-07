import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollSummaryService } from '../payroll-summary.service';
import { prisma } from '../../db';

// Mock prisma
vi.mock('../../db', () => ({
  prisma: {
    employee: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    timeEntry: {
      findMany: vi.fn(),
    },
    overtime: {
      findMany: vi.fn(),
    },
    holiday: {
      findMany: vi.fn(),
    },
    payroll: {
      findFirst: vi.fn(),
    },
  },
}));

describe('PayrollSummaryService', () => {
  let service: PayrollSummaryService;

  beforeEach(() => {
    service = new PayrollSummaryService();
    vi.clearAllMocks();
  });

  describe('generateSummary', () => {
    const mockOrganizationId = 'org-123';
    const mockDepartmentId = 'dept-456';
    const mockPeriodStart = new Date('2024-01-16');
    const mockPeriodEnd = new Date('2024-01-31');

    it('should generate complete payroll summary', async () => {
      // Mock employee data
      (prisma.employee.count as any).mockResolvedValue(10);
      (prisma.employee.findMany as any).mockResolvedValue([
        {
          id: 'emp1',
          compensations: [{ id: 'comp1' }],
        },
        {
          id: 'emp2',
          compensations: [{ id: 'comp2' }],
        },
        {
          id: 'emp3',
          compensations: [], // Missing salary config
        },
      ]);

      // Mock time entries
      (prisma.timeEntry.findMany as any).mockResolvedValue([
        { id: 'te1', employeeId: 'emp1' },
        { id: 'te2', employeeId: 'emp2' },
        { id: 'te3', employeeId: 'emp1' },
      ]);

      // Mock overtime
      (prisma.overtime.findMany as any).mockResolvedValue([
        { status: 'APPROVED' },
        { status: 'APPROVED' },
        { status: 'PENDING' },
      ]);

      // Mock holidays
      (prisma.holiday.findMany as any).mockResolvedValue([
        { date: new Date('2024-01-20') },
      ]);

      // Mock existing payroll
      (prisma.payroll.findFirst as any).mockResolvedValue(null);

      const result = await service.generateSummary(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      // Verify structure
      expect(result).toHaveProperty('organizationId', mockOrganizationId);
      expect(result).toHaveProperty('departmentId', mockDepartmentId);
      expect(result).toHaveProperty('cutoffPeriod');
      expect(result).toHaveProperty('employees');
      expect(result).toHaveProperty('attendance');
      expect(result).toHaveProperty('overtime');
      expect(result).toHaveProperty('holidays');
      expect(result).toHaveProperty('readiness');
      expect(result).toHaveProperty('payrollStatus');

      // Verify cutoff period dates
      expect(result.cutoffPeriod.start).toBe('2024-01-16');
      expect(result.cutoffPeriod.end).toBe('2024-01-31');

      // Verify employee counts
      expect(result.employees.total).toBe(10);
      expect(result.employees.eligible).toBe(2);
      expect(result.employees.ineligible).toBe(1);
      expect(result.employees.exclusionReasons.missingSalaryConfig).toBe(1);

      // Verify attendance stats
      expect(result.attendance.totalRecords).toBe(3);
      expect(result.attendance.expectedEmployees).toBe(10);
      expect(result.attendance.employeesWithRecords).toBe(2); // emp1 and emp2
      expect(result.attendance.missingEmployeesCount).toBe(8);
      expect(result.attendance.complete).toBe(false);

      // Verify overtime stats
      expect(result.overtime.totalRequests).toBe(3);
      expect(result.overtime.approvedCount).toBe(2);
      expect(result.overtime.pendingCount).toBe(1);

      // Verify holiday stats
      expect(result.holidays.affectedEmployeesCount).toBe(10);

      // Verify readiness
      expect(result.readiness.canGenerate).toBe(false);
      expect(result.readiness.blockingIssues).toContain('No eligible employees found for payroll generation');
      expect(result.readiness.warnings).toContain('8 employees missing attendance records');

      // Verify payroll status
      expect(result.payrollStatus.currentStatus).toBe('PENDING');
      expect(result.payrollStatus.hasExistingRun).toBe(false);
    });

    it('should handle organization-only filtering (no department)', async () => {
      (prisma.employee.count as any).mockResolvedValue(5);
      (prisma.employee.findMany as any).mockResolvedValue([
        { id: 'emp1', compensations: [{ id: 'comp1' }] },
      ]);
      (prisma.timeEntry.findMany as any).mockResolvedValue([]);
      (prisma.overtime.findMany as any).mockResolvedValue([]);
      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.payroll.findFirst as any).mockResolvedValue(null);

      const result = await service.generateSummary(
        mockOrganizationId,
        undefined, // No department
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result.organizationId).toBe(mockOrganizationId);
      expect(result.departmentId).toBeUndefined();
      expect(result.employees.total).toBe(5);
    });

    it('should handle successful payroll generation readiness', async () => {
      // Mock all data as complete and valid
      (prisma.employee.count as any).mockResolvedValue(3);
      (prisma.employee.findMany as any).mockResolvedValue([
        { id: 'emp1', compensations: [{ id: 'comp1' }] },
        { id: 'emp2', compensations: [{ id: 'comp2' }] },
        { id: 'emp3', compensations: [{ id: 'comp3' }] },
      ]);

      (prisma.timeEntry.findMany as any).mockResolvedValue([
        { id: 'te1', employeeId: 'emp1' },
        { id: 'te2', employeeId: 'emp2' },
        { id: 'te3', employeeId: 'emp3' },
      ]);

      (prisma.overtime.findMany as any).mockResolvedValue([]);
      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.payroll.findFirst as any).mockResolvedValue(null);

      const result = await service.generateSummary(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result.readiness.canGenerate).toBe(true);
      expect(result.readiness.blockingIssues).toHaveLength(0);
      expect(result.attendance.complete).toBe(true);
      expect(result.employees.eligible).toBe(3);
      expect(result.employees.ineligible).toBe(0);
    });

    it('should detect existing payroll runs', async () => {
      (prisma.employee.count as any).mockResolvedValue(1);
      (prisma.employee.findMany as any).mockResolvedValue([
        { id: 'emp1', compensations: [{ id: 'comp1' }] },
      ]);
      (prisma.timeEntry.findMany as any).mockResolvedValue([
        { id: 'te1', employeeId: 'emp1' },
      ]);
      (prisma.overtime.findMany as any).mockResolvedValue([]);
      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.payroll.findFirst as any).mockResolvedValue({
        processedAt: new Date('2024-01-15T10:00:00Z'),
      });

      const result = await service.generateSummary(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result.payrollStatus.hasExistingRun).toBe(true);
      expect(result.payrollStatus.lastGeneratedAt).toBe('2024-01-15T10:00:00.000Z');
      expect(result.readiness.warnings).toContain('Payroll has already been generated for this period');
    });

    it('should handle empty employee list', async () => {
      (prisma.employee.count as any).mockResolvedValue(0);
      (prisma.employee.findMany as any).mockResolvedValue([]);
      (prisma.timeEntry.findMany as any).mockResolvedValue([]);
      (prisma.overtime.findMany as any).mockResolvedValue([]);
      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.payroll.findFirst as any).mockResolvedValue(null);

      const result = await service.generateSummary(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result.employees.total).toBe(0);
      expect(result.employees.eligible).toBe(0);
      expect(result.employees.ineligible).toBe(0);
      expect(result.readiness.canGenerate).toBe(false);
      expect(result.readiness.blockingIssues).toContain('No eligible employees found for payroll generation');
    });

    it('should handle all employees missing attendance', async () => {
      (prisma.employee.count as any).mockResolvedValue(2);
      (prisma.employee.findMany as any).mockResolvedValue([
        { id: 'emp1', compensations: [{ id: 'comp1' }] },
        { id: 'emp2', compensations: [{ id: 'comp2' }] },
      ]);

      (prisma.timeEntry.findMany as any).mockResolvedValue([]); // No attendance records
      (prisma.overtime.findMany as any).mockResolvedValue([]);
      (prisma.holiday.findMany as any).mockResolvedValue([]);
      (prisma.payroll.findFirst as any).mockResolvedValue(null);

      const result = await service.generateSummary(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result.attendance.employeesWithRecords).toBe(0);
      expect(result.attendance.missingEmployeesCount).toBe(2);
      expect(result.attendance.complete).toBe(false);
      expect(result.readiness.canGenerate).toBe(true); // Still can generate, just with warnings
      expect(result.readiness.warnings).toContain('2 employees missing attendance records');
    });
  });

  describe('getEmployeeCount', () => {
    it('should count employees by organization only', async () => {
      (prisma.employee.count as any).mockResolvedValue(5);

      const result = await service['getEmployeeCount']('org-123', undefined);

      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
      });
      expect(result).toBe(5);
    });

    it('should count employees by organization and department', async () => {
      (prisma.employee.count as any).mockResolvedValue(3);

      const result = await service['getEmployeeCount']('org-123', 'dept-456');

      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-123', departmentId: 'dept-456' },
      });
      expect(result).toBe(3);
    });
  });
});
