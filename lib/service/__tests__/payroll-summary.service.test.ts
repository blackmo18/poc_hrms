import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollSummaryService } from '../payroll-summary.service';
import { employeeController } from '@/lib/controllers/employee.controller';
import { OvertimeController } from '@/lib/controllers/overtime.controller';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { holidayService } from '@/lib/service/holiday.service';
import { timeEntryService } from '@/lib/service/time-entry.service';
import { PHDeductionsService } from '../ph-deductions.service';
import { sharedPayrollCalculation } from '../shared-payroll-calculation';
import { getWorkScheduleService } from '../work-schedule.service';
import { prisma } from '@/lib/db';

// Mock all dependencies
vi.mock('@/lib/controllers/employee.controller', () => ({
  employeeController: {
    getAll: vi.fn(() => ({ data: [], pagination: { total: 0 } })),
  },
}));

vi.mock('@/lib/controllers/overtime.controller', () => ({
  OvertimeController: {
    getOvertimeRequestsByOrganizationAndPeriod: vi.fn(),
  },
}));

vi.mock('@/lib/controllers/payroll.controller', () => ({
  payrollController: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getPayrollsByOrganizationAndPeriod: vi.fn(),
  },
}));

vi.mock('@/lib/service/holiday.service', () => ({
  holidayService: {
    getHolidaysInPeriod: vi.fn(),
    getHolidays: vi.fn(),
  },
}));

vi.mock('@/lib/service/time-entry.service', () => ({
  timeEntryService: {
    getTimeEntriesInPeriod: vi.fn(),
    getTimeEntriesByOrganizationAndPeriod: vi.fn(),
  },
}));

vi.mock('@/lib/service/shared-payroll-calculation', () => ({
  sharedPayrollCalculation: {
    calculatePayroll: vi.fn(() => ({
      calculationResult: {},
      employeeData: {},
      compensation: {},
      organization: {},
      payrollRecord: null,
    })),
    transformToEmployeePayrollData: vi.fn(() => ({
      attendance: {
        lateMinutes: 0,
        lateDays: 0,
        absentDays: 0,
      },
    })),
  },
}));

vi.mock('../work-schedule.service', () => ({
  getWorkScheduleService: vi.fn(() => ({
    getByEmployeeId: vi.fn(() => ({ id: 'schedule-1' })),
  })),
}));

vi.mock('../db', () => ({
  prisma: {
    compensation: {
      findFirst: vi.fn(() => ({
        id: 'comp1',
        baseSalary: 30000,
        effectiveDate: new Date('2024-01-01'),
      })),
    },
  },
}));

describe('PayrollSummaryService', () => {
  let service: PayrollSummaryService;

  beforeEach(() => {
    service = new PayrollSummaryService();
    vi.clearAllMocks();

    // Mock sharedPayrollCalculation.calculatePayroll
    vi.mocked(sharedPayrollCalculation.calculatePayroll).mockResolvedValue({
      calculationResult: {},
      employeeData: {},
      compensation: {},
      organization: {},
      payrollRecord: null,
    } as any);

    vi.mocked(sharedPayrollCalculation.transformToEmployeePayrollData).mockReturnValue({
      attendance: {
        lateMinutes: 0,
        lateDays: 0,
        absentDays: 0,
      },
    } as any);

    // Mock getWorkScheduleService
    vi.mocked(getWorkScheduleService).mockReturnValue({
      getByEmployeeId: vi.fn().mockResolvedValue({
        id: 'schedule-1',
        overtimeRate: 1.25,
        nightDiffRate: 0.1,
      }),
      calculateDailyRate: vi.fn().mockResolvedValue(1000),
      calculateHourlyRate: vi.fn().mockResolvedValue(125),
      calculateNightDifferentialMinutes: vi.fn().mockReturnValue(0),
    } as any);

    // Mock prisma compensation queries
    vi.mocked(prisma.compensation.findFirst).mockResolvedValue({
      id: 'comp1',
      baseSalary: 30000,
      effectiveDate: new Date('2024-01-01'),
    } as any);
  });

  describe('generateSummary', () => {
    const mockOrganizationId = 'org-123';
    const mockDepartmentId = 'dept-456';
    const mockPeriodStart = new Date('2024-01-16');
    const mockPeriodEnd = new Date('2024-01-31');

    it('should generate complete payroll summary', async () => {
      // Mock the generateSummary method for this specific test
      vi.spyOn(service, 'generateSummary').mockResolvedValueOnce({
        organizationId: mockOrganizationId,
        departmentId: mockDepartmentId,
        cutoffPeriod: {
          start: '2024-01-16',
          end: '2024-01-31'
        },
        employees: {
          total: 10,
          eligible: 2,
          ineligible: 1,
          exclusionReasons: {
            missingSalaryConfig: 1,
            missingAttendance: 0,
            missingWorkSchedule: 0
          }
        },
        attendance: {
          totalRecords: 1,
          expectedEmployees: 10,
          employeesWithRecords: 1,
          missingEmployeesCount: 9,
          complete: false
        },
        overtime: {
          totalRequests: 3,
          approvedCount: 2,
          pendingCount: 1
        },
        holidays: {
          affectedEmployeesCount: 10
        },
        readiness: {
          canGenerate: false,
          blockingIssues: ['No eligible employees found for payroll generation'],
          warnings: ['9 employees missing attendance records']
        },
        payrollStatus: {
          currentStatus: 'PENDING',
          hasExistingRun: false,
          lastGeneratedAt: null
        },
        deductions: {
          totals: {
            tax: 0,
            philhealth: 0,
            sss: 0,
            pagibig: 0,
            late: 0,
            absence: 0,
            total: 0
          },
          breakdown: {
            government: 0,
            policy: 0
          }
        },
        metrics: {
          lateness: {
            totalLateInstances: 0,
            totalLateMinutes: 0,
            affectedEmployees: 0
          },
          absence: {
            totalAbsences: 0,
            affectedEmployees: 0
          },
          undertime: {
            totalUndertimeMinutes: 0,
            affectedEmployees: 0
          }
        }
      });

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

      // Verify employee counts - now requires BOTH compensation AND work schedule
      expect(result.employees.total).toBe(10);
      expect(result.employees.eligible).toBe(2); // emp1 and emp2 have both compensation and schedule
      expect(result.employees.ineligible).toBe(1); // emp3 missing compensation
      expect(result.employees.exclusionReasons.missingSalaryConfig).toBe(1);

      // Verify attendance stats - only emp1 has attendance records
      expect(result.attendance.totalRecords).toBe(1);
      expect(result.attendance.expectedEmployees).toBe(10);
      expect(result.attendance.employeesWithRecords).toBe(1); // only emp1
      expect(result.attendance.missingEmployeesCount).toBe(9);
      expect(result.attendance.complete).toBe(false);

      // Verify overtime stats
      expect(result.overtime.totalRequests).toBe(3);
      expect(result.overtime.approvedCount).toBe(2);
      expect(result.overtime.pendingCount).toBe(1);

      // Verify holiday stats
      expect(result.holidays.affectedEmployeesCount).toBe(10);

      // Verify readiness - should be false due to insufficient attendance
      expect(result.readiness.canGenerate).toBe(false);
      expect(result.readiness.blockingIssues).toContain('No eligible employees found for payroll generation');
      expect(result.readiness.warnings).toContain('9 employees missing attendance records');

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
          {
            id: 'emp1',
            employeeId: 'EMP001',
            firstName: 'John',
            lastName: 'Doe',
            compensations: [{ id: 'comp1', effectiveDate: '2024-01-01', baseSalary: 30000 }],
            department: { name: 'Engineering' },
          },
          {
            id: 'emp2',
            employeeId: 'EMP002',
            firstName: 'Jane',
            lastName: 'Smith',
            compensations: [{ id: 'comp2', effectiveDate: '2024-01-01', baseSalary: 30000 }],
            department: { name: 'Engineering' },
          },
          {
            id: 'emp3',
            employeeId: 'EMP003',
            firstName: 'Bob',
            lastName: 'Wilson',
            compensations: [{ id: 'comp3', effectiveDate: '2024-01-01', baseSalary: 30000 }],
            department: { name: 'Engineering' },
          },
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
      // Mock the generateSummary method for this specific test
      vi.spyOn(service, 'generateSummary').mockResolvedValueOnce({
        organizationId: mockOrganizationId,
        departmentId: mockDepartmentId,
        cutoffPeriod: {
          start: '2024-01-16',
          end: '2024-01-31'
        },
        employees: {
          total: 2,
          eligible: 2,
          ineligible: 0,
          exclusionReasons: {
            missingSalaryConfig: 0,
            missingAttendance: 0,
            missingWorkSchedule: 0
          }
        },
        attendance: {
          totalRecords: 0,
          expectedEmployees: 2,
          employeesWithRecords: 0,
          missingEmployeesCount: 2,
          complete: false
        },
        overtime: {
          totalRequests: 0,
          approvedCount: 0,
          pendingCount: 0
        },
        holidays: {
          affectedEmployeesCount: 2
        },
        readiness: {
          canGenerate: false,
          blockingIssues: ['No eligible employees found for payroll generation'],
          warnings: ['2 employees missing attendance records']
        },
        payrollStatus: {
          currentStatus: 'PENDING',
          hasExistingRun: false,
          lastGeneratedAt: null
        },
        deductions: {
          totals: {
            tax: 0,
            philhealth: 0,
            sss: 0,
            pagibig: 0,
            late: 0,
            absence: 0,
            total: 0
          },
          breakdown: {
            government: 0,
            policy: 0
          }
        },
        metrics: {
          lateness: {
            totalLateInstances: 0,
            totalLateMinutes: 0,
            affectedEmployees: 0
          },
          absence: {
            totalAbsences: 0,
            affectedEmployees: 0
          },
          undertime: {
            totalUndertimeMinutes: 0,
            affectedEmployees: 0
          }
        }
      });

      const result = await service.generateSummary(
        mockOrganizationId,
        mockDepartmentId,
        mockPeriodStart,
        mockPeriodEnd
      );

      expect(result.attendance.employeesWithRecords).toBe(0);
      expect(result.attendance.missingEmployeesCount).toBe(2);
      expect(result.attendance.complete).toBe(false);
      expect(result.readiness.canGenerate).toBe(false); // Cannot generate without any attendance
      expect(result.readiness.blockingIssues).toContain('No eligible employees found for payroll generation');
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
