import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollSummaryService } from '../payroll-summary.service';
import { employeeController } from '@/lib/controllers/employee.controller';
import { OvertimeController } from '@/lib/controllers/overtime.controller';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { holidayService } from '@/lib/service/holiday.service';
import { timeEntryService } from '@/lib/service/time-entry.service';

// Mock all dependencies
vi.mock('@/lib/controllers/employee.controller', () => ({
  employeeController: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/lib/controllers/overtime.controller', () => ({
  OvertimeController: {
    getOvertimeRequestsByOrganizationAndPeriod: vi.fn(),
  },
}));

vi.mock('@/lib/controllers/payroll.controller', () => ({
  payrollController: {
    getPayrollsByOrganizationAndPeriod: vi.fn(),
  },
}));

vi.mock('@/lib/service/holiday.service', () => ({
  holidayService: {
    getHolidays: vi.fn(),
  },
}));

vi.mock('@/lib/service/time-entry.service', () => ({
  timeEntryService: {
    getTimeEntriesByOrganizationAndPeriod: vi.fn(),
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
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 10 },
        data: [],
      });
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 10 },
        data: [
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
        ],
      });

      // Mock time entries
      (timeEntryService.getTimeEntriesByOrganizationAndPeriod as any).mockResolvedValue([
        { id: 'te1', employeeId: 'emp1' },
        { id: 'te2', employeeId: 'emp2' },
        { id: 'te3', employeeId: 'emp1' },
      ]);

      // Mock overtime
      (OvertimeController.getOvertimeRequestsByOrganizationAndPeriod as any).mockResolvedValue([
        { status: 'APPROVED' },
        { status: 'APPROVED' },
        { status: 'PENDING' },
      ]);

      // Mock holidays
      (holidayService.getHolidays as any).mockResolvedValue([
        { date: new Date('2024-01-20') },
      ]);

      // Mock existing payroll
      (payrollController.getPayrollsByOrganizationAndPeriod as any).mockResolvedValue([]);

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
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 5 },
        data: [],
      });
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 5 },
        data: [
          { id: 'emp1', compensations: [{ id: 'comp1' }] },
        ],
      });
      (timeEntryService.getTimeEntriesByOrganizationAndPeriod as any).mockResolvedValue([]);
      (OvertimeController.getOvertimeRequestsByOrganizationAndPeriod as any).mockResolvedValue([]);
      (holidayService.getHolidays as any).mockResolvedValue([]);
      (payrollController.getPayrollsByOrganizationAndPeriod as any).mockResolvedValue([]);

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
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 3 },
        data: [],
      });
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 3 },
        data: [
          { id: 'emp1', compensations: [{ id: 'comp1' }] },
          { id: 'emp2', compensations: [{ id: 'comp2' }] },
          { id: 'emp3', compensations: [{ id: 'comp3' }] },
        ],
      });

      (timeEntryService.getTimeEntriesByOrganizationAndPeriod as any).mockResolvedValue([
        { id: 'te1', employeeId: 'emp1' },
        { id: 'te2', employeeId: 'emp2' },
        { id: 'te3', employeeId: 'emp3' },
      ]);

      (OvertimeController.getOvertimeRequestsByOrganizationAndPeriod as any).mockResolvedValue([]);
      (holidayService.getHolidays as any).mockResolvedValue([]);
      (payrollController.getPayrollsByOrganizationAndPeriod as any).mockResolvedValue([]);

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
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 1 },
        data: [],
      });
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 1 },
        data: [
          { id: 'emp1', compensations: [{ id: 'comp1' }] },
        ],
      });
      (timeEntryService.getTimeEntriesByOrganizationAndPeriod as any).mockResolvedValue([
        { id: 'te1', employeeId: 'emp1' },
      ]);
      (OvertimeController.getOvertimeRequestsByOrganizationAndPeriod as any).mockResolvedValue([]);
      (holidayService.getHolidays as any).mockResolvedValue([]);
      (payrollController.getPayrollsByOrganizationAndPeriod as any).mockResolvedValue([
        { processedAt: new Date('2024-01-15T10:00:00Z') },
      ]);

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
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 0 },
        data: [],
      });
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 0 },
        data: [],
      });
      (timeEntryService.getTimeEntriesByOrganizationAndPeriod as any).mockResolvedValue([]);
      (OvertimeController.getOvertimeRequestsByOrganizationAndPeriod as any).mockResolvedValue([]);
      (holidayService.getHolidays as any).mockResolvedValue([]);
      (payrollController.getPayrollsByOrganizationAndPeriod as any).mockResolvedValue([]);

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
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 2 },
        data: [],
      });
      (employeeController.getAll as any).mockResolvedValueOnce({
        pagination: { total: 2 },
        data: [
          { id: 'emp1', compensations: [{ id: 'comp1' }] },
          { id: 'emp2', compensations: [{ id: 'comp2' }] },
        ],
      });

      (timeEntryService.getTimeEntriesByOrganizationAndPeriod as any).mockResolvedValue([]); // No attendance records
      (OvertimeController.getOvertimeRequestsByOrganizationAndPeriod as any).mockResolvedValue([]);
      (holidayService.getHolidays as any).mockResolvedValue([]);
      (payrollController.getPayrollsByOrganizationAndPeriod as any).mockResolvedValue([]);

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
      (employeeController.getAll as any).mockResolvedValue({
        pagination: { total: 5 },
        data: [],
      });

      const result = await service['getEmployeeCount']('org-123', undefined);

      expect(employeeController.getAll).toHaveBeenCalledWith('org-123', undefined, { page: 1, limit: 1 });
      expect(result).toBe(5);
    });

    it('should count employees by organization and department', async () => {
      (employeeController.getAll as any).mockResolvedValue({
        pagination: { total: 3 },
        data: [],
      });

      const result = await service['getEmployeeCount']('org-123', 'dept-456');

      expect(employeeController.getAll).toHaveBeenCalledWith('org-123', 'dept-456', { page: 1, limit: 1 });
      expect(result).toBe(3);
    });
  });
});
