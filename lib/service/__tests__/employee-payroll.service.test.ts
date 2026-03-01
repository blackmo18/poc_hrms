import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmployeePayrollService } from '@/lib/service/employee-payroll.service';
import { PayrollController } from '@/lib/controllers/payroll.controller';
import { EmployeeController } from '@/lib/controllers/employee.controller';
import { CompensationController } from '@/lib/controllers/compensation.controller';
import { PayrollCalculationService } from '@/lib/service/payroll-calculation.service';
import { prisma } from '@/lib/db';

vi.mock('../controllers/payroll.controller');
vi.mock('../controllers/employee.controller');
vi.mock('../controllers/compensation.controller');
vi.mock('../db', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
    },
    payrollEarning: {
      findMany: vi.fn(),
    },
    deduction: {
      findMany: vi.fn(),
    },
    attendanceTimeEntry: {
      findMany: vi.fn(),
    },
    timeEntry: {
      findMany: vi.fn(),
    },
  },
}));

describe('EmployeePayrollService', () => {
  let employeePayrollService: EmployeePayrollService;
  let mockPayrollController: any;
  let mockEmployeeController: any;
  let mockCompensationController: any;
  let mockPayrollCalculationService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mocks
    mockPayrollController = {
      getAll: vi.fn(),
    } as any;

    mockEmployeeController = {
      getById: vi.fn(),
    } as any;

    mockCompensationController = {
      getAll: vi.fn(),
    } as any;

    mockPayrollCalculationService = {
      calculateCompletePayroll: vi.fn(),
      calculateActualAbsentDays: vi.fn(),
    } as any;

    employeePayrollService = new EmployeePayrollService();
    (employeePayrollService as any).payrollController = mockPayrollController;
    (employeePayrollService as any).employeeController = mockEmployeeController;
    (employeePayrollService as any).compensationController = mockCompensationController;
    vi.spyOn(employeePayrollService as any, 'payrollCalculationService', 'get').mockReturnValue(mockPayrollCalculationService);
  });

  describe('getEmployeePayroll', () => {
    const testEmployeeId = 'emp-001';
    const testOrganizationId = 'org-001';
    const testPeriodStart = new Date('2026-02-01');
    const testPeriodEnd = new Date('2026-02-15');

    it('should return existing payroll with correct attendance calculations', async () => {
      // Arrange
      const mockEmployee = {
        id: testEmployeeId,
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        department: { name: 'Engineering' },
        jobTitle: { name: 'Software Engineer' },
        organization: { id: testOrganizationId, name: 'Tech Corp' },
      };

      const mockExistingPayroll = {
        id: 'payroll-001',
        employeeId: testEmployeeId,
        organizationId: testOrganizationId,
        grossPay: 22500,
        netPay: 18000,
        totalDeductions: 4500,
        status: 'COMPUTED',
        employee: mockEmployee,
        organization: { name: 'Tech Corp' },
      };

      const mockDeductions = [
        { type: 'SSS', amount: 500 },
        { type: 'PHILHEALTH', amount: 300 },
        { type: 'PAGIBIG', amount: 200 },
        { type: 'TAX', amount: 1000 },
        { type: 'LATE', amount: 100 },
        { type: 'ABSENCE', amount: 2400 },
      ];

      const mockEarnings = [
        { type: 'BASE_SALARY', amount: 22500, hours: 160 },
        { type: 'OVERTIME', amount: 1500, hours: 8 },
      ];

      const mockTimeEntries = [
        { workDate: new Date('2026-02-02') },
        { workDate: new Date('2026-02-03') },
        { workDate: new Date('2026-02-04') },
        { workDate: new Date('2026-02-06') },
        { workDate: new Date('2026-02-09') },
        { workDate: new Date('2026-02-10') },
        { workDate: new Date('2026-02-11') },
        { workDate: new Date('2026-02-13') },
      ];

      mockPayrollController.getAll.mockResolvedValue([mockExistingPayroll]);
      (prisma.organization.findUnique as any).mockResolvedValue({
        id: testOrganizationId,
        name: 'Tech Corp',
      });
      (prisma.deduction.findMany as any).mockResolvedValue(mockDeductions);
      (prisma.payrollEarning.findMany as any).mockResolvedValue(mockEarnings);
      (prisma.timeEntry.findMany as any).mockResolvedValue(mockTimeEntries);
      mockPayrollCalculationService.calculateActualAbsentDays.mockResolvedValue(2);

      // Act
      const result = await employeePayrollService.getEmployeePayroll(
        testEmployeeId,
        testOrganizationId,
        testPeriodStart,
        testPeriodEnd
      );

      // Assert
      expect(result).toMatchObject({
        id: 'payroll-001',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        departmentName: 'Engineering',
        position: 'Software Engineer',
        attendance: {
          presentDays: 8, // From time entries
          absentDays: 2, // From calculation service
          lateDays: 1, // From LATE deduction records
          overtimeHours: 8, // From OVERTIME earnings
          lateMinutes: 0, // TODO - should be calculated
          undertimeMinutes: 0,
        },
        earnings: {
          basicSalary: 22500,
          overtimePay: 1500,
          totalEarnings: 22500,
        },
        deductions: {
          sss: 500,
          philhealth: 300,
          pagibig: 200,
          withholdingTax: 1000,
          lateDeduction: 100,
          absenceDeduction: 2400,
          totalDeductions: 4500,
        },
        netPay: 18000,
      });
    });

    it('should calculate new payroll when no existing record found', async () => {
      // Arrange
      const mockEmployee = {
        id: testEmployeeId,
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        department: { name: 'Engineering' },
        jobTitle: { name: 'Software Engineer' },
        organization: { id: testOrganizationId },
        compensations: [
          {
            baseSalary: 45000,
            effectiveDate: new Date('2024-01-01'),
          },
        ],
      };

      const mockCalculationResult = {
        employeeId: testEmployeeId,
        period_start: testPeriodStart,
        period_end: testPeriodEnd,
        total_regular_pay: 22500,
        total_overtime_pay: 0,
        total_night_diff_pay: 0,
        total_gross_pay: 22500,
        total_deductions: 4500,
        total_net_pay: 18000,
        total_regular_minutes: 960,
        total_overtime_minutes: 0,
        total_night_diff_minutes: 0,
        daily_breakdown: [
          { regular_minutes: 480, late_minutes: 0, undertime_minutes: 0 },
          { regular_minutes: 480, late_minutes: 15, undertime_minutes: 0 },
        ],
        government_deductions: {
          tax: 1000,
          sss: 500,
          philhealth: 300,
          pagibig: 200,
          total: 2000,
        },
        policy_deductions: {
          late: 100,
          absence: 0,
          total: 100,
        },
      };

      mockPayrollController.getAll.mockResolvedValue([]); // No existing payroll
      mockEmployeeController.getById.mockResolvedValue(mockEmployee);
      (prisma.organization.findUnique as any).mockResolvedValue({
        id: testOrganizationId,
        name: 'Tech Corp',
      });
      mockPayrollCalculationService.calculateCompletePayroll.mockResolvedValue(mockCalculationResult);
      mockPayrollCalculationService.calculateActualAbsentDays.mockResolvedValue(0);

      // Act
      const result = await employeePayrollService.getEmployeePayroll(
        testEmployeeId,
        testOrganizationId,
        testPeriodStart,
        testPeriodEnd
      );

      // Assert
      expect(result).toMatchObject({
        id: null, // No payroll record created yet
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        baseSalary: 45000,
        attendance: {
          presentDays: 2, // From daily breakdown
          absentDays: 0, // From calculation service
          lateDays: 1, // From daily breakdown (late_minutes > 0)
          overtimeHours: 0,
          lateMinutes: 15, // Sum of late minutes
          undertimeMinutes: 0,
        },
        earnings: {
          basicSalary: 22500,
          totalEarnings: 22500,
        },
        deductions: {
          sss: 500,
          philhealth: 300,
          pagibig: 200,
          withholdingTax: 1000,
          lateDeduction: 100,
          absenceDeduction: 0,
        },
        netPay: 18000,
      });
    });

    it('should handle employee without compensation', async () => {
      // Arrange
      const mockEmployee = {
        id: testEmployeeId,
        firstName: 'John',
        lastName: 'Doe',
        compensations: [], // No compensation
      };

      mockPayrollController.getAll.mockResolvedValue([]);
      mockEmployeeController.getById.mockResolvedValue(mockEmployee);

      // Act & Assert
      await expect(
        employeePayrollService.getEmployeePayroll(
          testEmployeeId,
          testOrganizationId,
          testPeriodStart,
          testPeriodEnd
        )
      ).rejects.toThrow('No compensation found for employee: emp-001');
    });
  });

  describe('transformExistingPayroll', () => {
    const testEmployeeId = 'emp-001';
    const testOrganizationId = 'org-001';
    
    it('should calculate attendance correctly from time entries', async () => {
      // Arrange
      const testPeriodStart = new Date('2026-02-01');
      const testPeriodEnd = new Date('2026-02-15');
      
      const mockPayroll = {
        id: 'payroll-001',
        employeeId: testEmployeeId,
        employee: {
          employeeId: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          department: { name: 'Engineering' },
          jobTitle: { name: 'Software Engineer' },
        },
        grossPay: 22500,
        totalDeductions: 4500,
        netPay: 18000,
      };

      // 8 time entries for 8 present days
      const mockTimeEntries = Array.from({ length: 8 }, (_, i) => ({
        workDate: new Date(2026, 1, i + 2), // Feb 2-9 (skipping weekends)
      }));

      const mockDeductions = [
        { type: 'LATE', amount: 100 }, // 1 late day
        { type: 'ABSENCE', amount: 0 },
      ];

      const mockEarnings = [
        { type: 'OVERTIME', amount: 1500, hours: 8 }, // 8 overtime hours
      ];

      (prisma.organization.findUnique as any).mockResolvedValue({
        id: testOrganizationId,
        name: 'Tech Corp',
      });
      (prisma.deduction.findMany as any).mockResolvedValue(mockDeductions);
      (prisma.payrollEarning.findMany as any).mockResolvedValue(mockEarnings);
      (prisma.timeEntry.findMany as any).mockResolvedValue(mockTimeEntries);
      mockPayrollCalculationService.calculateActualAbsentDays.mockResolvedValue(2);

      // Act
      const result = await (employeePayrollService as any).transformExistingPayroll(
        mockPayroll,
        testOrganizationId,
        testPeriodStart,
        testPeriodEnd
      );

      // Assert
      expect(result.attendance).toEqual({
        presentDays: 8, // From time entries
        absentDays: 2, // From calculation service
        lateDays: 1, // From LATE deduction records
        overtimeHours: 8, // From OVERTIME earnings
        lateMinutes: 0, // TODO - needs implementation
        undertimeMinutes: 0,
      });
    });
  });
});
