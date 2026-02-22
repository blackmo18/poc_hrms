import { vi, describe, it, expect, beforeEach, test } from 'vitest';
import { getPayrollService } from '../payroll.service';
import { PayrollStatus } from '@prisma/client';

// Mock all the controller and service dependencies
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
  };
});
vi.mock('@/lib/controllers/payroll.controller');
vi.mock('@/lib/controllers/payroll-earning.controller');
vi.mock('@/lib/controllers/deduction.controller');
vi.mock('@/lib/controllers/employee.controller');
vi.mock('../payroll-calculation.service');
vi.mock('../payroll-log.service');
vi.mock('../payroll-earning.service');
vi.mock('../deduction.service');
vi.mock('@/lib/di/container');
// Import after mocking
import { payrollController } from '@/lib/controllers/payroll.controller';
import { PayrollEarningController } from '@/lib/controllers/payroll-earning.controller';
import { DeductionController } from '@/lib/controllers/deduction.controller';
import { employeeController } from '@/lib/controllers/employee.controller';
import { PayrollCalculationService } from '../payroll-calculation.service';
import { PayrollLogService } from '../payroll-log.service';
import { getPayrollEarningService } from '../payroll-earning.service';
import { getDeductionService } from '../deduction.service';
import { getServiceContainer } from '@/lib/di/container';

describe('PayrollService - Generation', () => {
  let payrollService: any;
  let mockPayrollController: any;
  let mockPayrollEarningController: any;
  let mockDeductionController: any;
  let mockEmployeeController: any;
  let mockPayrollCalculationService: any;
  let mockPayrollLogService: any;
  let mockPayrollEarningService: any;
  let mockDeductionService: any;

  const mockOrganizationId = 'org-123';
  const mockEmployeeId = 'emp-123';
  const mockDepartmentId = 'dept-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayrollController = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn(),
    };

    mockPayrollEarningController = {
      create: vi.fn(),
    };

    mockDeductionController = {
      create: vi.fn(),
    };

    mockEmployeeController = {
      getById: vi.fn(),
    };

    mockPayrollCalculationService = {
      calculateCompletePayroll: vi.fn(),
    };

    mockPayrollLogService = {
      logAction: vi.fn(),
    };

    mockPayrollEarningService = {
      create: vi.fn(),
      getAll: vi.fn(),
    };

    mockDeductionService = {
      create: vi.fn(),
      getAll: vi.fn(),
    };

    // Mock the imports
    Object.assign(payrollController, mockPayrollController);
    (PayrollEarningController as any).mockReturnValue(mockPayrollEarningController);
    (DeductionController as any).mockReturnValue(mockDeductionController);
    Object.assign(employeeController, mockEmployeeController);
    (PayrollCalculationService as any).mockReturnValue(mockPayrollCalculationService);
    (PayrollLogService.getInstance as any).mockReturnValue(mockPayrollLogService);
    (getPayrollEarningService as any).mockReturnValue(mockPayrollEarningService);
    (getDeductionService as any).mockReturnValue(mockDeductionService);
    (getServiceContainer as any).mockReturnValue({
      getPayrollCalculationService: () => mockPayrollCalculationService,
    });

    payrollService = getPayrollService();

    // Mock employeeController.getById to return valid employee
    mockEmployeeController.getById.mockResolvedValue({
      id: mockEmployeeId,
      organizationId: mockOrganizationId,
    } as any);
  });

  describe('generatePayroll', () => {
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-01-05');

    it('should generate payroll successfully', async () => {
      // Mock no existing payroll
      mockPayrollController.getAll.mockResolvedValue([]);

      // Mock employee data
      mockEmployeeController.getById.mockResolvedValue({
        id: mockEmployeeId,
        organizationId: mockOrganizationId,
        departmentId: mockDepartmentId,
      } as any);

      // Mock payroll calculation result
      mockPayrollCalculationService.calculateCompletePayroll.mockResolvedValue({
        total_gross_pay: 5000,
        total_net_pay: 4350,
        taxable_income: 3265,
        total_regular_minutes: 40,
        total_regular_pay: 5000,
        total_overtime_pay: 0,
        total_overtime_minutes: 0,
        total_night_diff_pay: 0,
        total_night_diff_minutes: 0,
        total_deductions: 650,
        government_deductions: { tax: 250, philhealth: 125, sss: 225, pagibig: 50 },
        policy_deductions: { late: 0, absence: 0 }
      });

      // Mock payroll creation
      const mockPayroll = {
        id: 'payroll-123',
        employeeId: mockEmployeeId,
        organizationId: mockOrganizationId,
        status: PayrollStatus.COMPUTED,
        periodStart: periodStart,
        periodEnd: periodEnd
      };
      mockPayrollController.create.mockResolvedValue(mockPayroll);

      // Mock earning creation
      mockPayrollEarningService.create.mockResolvedValue({ id: 'earning-1' });

      // Mock deduction creation
      mockDeductionService.create.mockResolvedValue({ id: 'deduction-1' });

      const result = await payrollService.generatePayroll(
        {
          employeeId: mockEmployeeId,
          organizationId: mockOrganizationId,
          periodStart,
          periodEnd,
        },
        mockUserId
      );

      expect(result.payroll).toEqual(mockPayroll);
      expect(result.earnings).toHaveLength(1); // Regular pay earning
      expect(result.deductions).toHaveLength(6); // 4 government + 2 policy deductions
      expect(result.log).toBeUndefined();

      // Verify payroll creation
      expect(mockPayrollController.create).toHaveBeenCalledWith({
        employeeId: mockEmployeeId,
        organizationId: mockOrganizationId,
        departmentId: mockDepartmentId,
        periodStart,
        periodEnd,
        grossPay: 5000,
        netPay: 4350,
        taxableIncome: 3265,
        taxDeduction: 250,
        philhealthDeduction: 125,
        sssDeduction: 225,
        pagibigDeduction: 50,
        totalDeductions: 650,
        status: PayrollStatus.COMPUTED,
      });

      // Verify log creation
      expect(mockPayrollLogService.logAction).toHaveBeenCalledWith({
        payrollId: 'payroll-123',
        action: 'GENERATED',
        previousStatus: null,
        newStatus: 'COMPUTED',
        reason: 'Payroll generated from time entries',
        userId: mockUserId,
      });
    });

    it('should return existing payroll if it already exists for period', async () => {
      // Mock existing payroll
      const existingPayroll = {
        id: 'existing-payroll',
        employeeId: mockEmployeeId,
        organizationId: mockOrganizationId,
        departmentId: mockDepartmentId,
        periodStart,
        periodEnd,
        status: PayrollStatus.COMPUTED,
        grossPay: 5000,
        netPay: 4350,
      };
      mockPayrollController.getAll.mockResolvedValue([existingPayroll]);

      // Mock existing earnings and deductions
      const mockEarnings = [{ id: 'earning-1', type: 'BASE_SALARY', amount: 5000 }];
      const mockDeductions = [{ id: 'deduction-1', type: 'TAX', amount: 250 }];
      
      mockPayrollEarningService.getAll.mockResolvedValue({ data: mockEarnings });
      mockDeductionService.getAll.mockResolvedValue({ data: mockDeductions });

      const result = await payrollService.generatePayroll(
        {
          employeeId: mockEmployeeId,
          organizationId: mockOrganizationId,
          periodStart,
          periodEnd,
        },
        mockUserId
      );

      // Should return existing payroll data
      expect(result.payroll).toEqual(existingPayroll);
      expect(result.earnings).toEqual(mockEarnings);
      expect(result.deductions).toEqual(mockDeductions);
      expect(result.log).toBeUndefined();

      // Should not create new payroll or log generation
      expect(mockPayrollController.create).not.toHaveBeenCalled();
      expect(mockPayrollLogService.logAction).not.toHaveBeenCalled();
    });

    it('should include overtime earnings when present', async () => {
      // Mock no existing payroll
      mockPayrollController.getAll.mockResolvedValue([]);

      // Mock employee data
      mockEmployeeController.getById.mockResolvedValue({
        id: mockEmployeeId,
        organizationId: mockOrganizationId,
      } as any);

      // Mock payroll calculation result with overtime
      mockPayrollCalculationService.calculateCompletePayroll.mockResolvedValue({
        total_gross_pay: 5150,
        total_net_pay: 4490,
        taxable_income: 3370,
        government_deductions: {
          tax: 258,
          philhealth: 129,
          sss: 232,
          pagibig: 52,
        },
        policy_deductions: {
          late: 0,
          absence: 0,
        },
        total_deductions: 671,
        total_regular_minutes: 2400,
        total_overtime_minutes: 120,
        total_regular_pay: 5000,
        total_overtime_pay: 150,
        total_night_diff_pay: 0,
      });

      // Mock created entities
      const mockPayroll = {
        id: 'payroll-123',
        employeeId: mockEmployeeId,
        organizationId: mockOrganizationId,
        status: PayrollStatus.COMPUTED,
        grossPay: 5150,
        netPay: 4490,
      };

      mockPayrollController.create.mockResolvedValue(mockPayroll);
      mockPayrollEarningService.create
        .mockResolvedValueOnce({ id: 'earning-1' }) // Regular pay
        .mockResolvedValueOnce({ id: 'earning-2' }); // Overtime pay
      mockDeductionService.create.mockResolvedValue({ id: 'deduction-1' });

      const result = await payrollService.generatePayroll(
        {
          employeeId: mockEmployeeId,
          organizationId: mockOrganizationId,
          periodStart,
          periodEnd,
        },
        mockUserId
      );

      expect(result.earnings).toHaveLength(2); // Regular pay + overtime earnings
      expect(mockPayrollEarningService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('approvePayroll', () => {
    it('should approve payroll successfully', async () => {
      const payrollId = 'payroll-123';
      const mockPayroll = {
        id: payrollId,
        status: PayrollStatus.COMPUTED,
        employeeId: mockEmployeeId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-05'),
      };

      mockPayrollController.getById.mockResolvedValue(mockPayroll);
      mockPayrollController.update.mockResolvedValue({
        ...mockPayroll,
        status: PayrollStatus.APPROVED,
        approvedAt: expect.any(Date),
        approvedBy: mockUserId,
      });

      const result = await payrollService.approvePayroll(payrollId, mockUserId, 'Approved for processing');

      expect(result.status).toBe(PayrollStatus.APPROVED);
      expect(mockPayrollController.update).toHaveBeenCalledWith(payrollId, {
        status: PayrollStatus.APPROVED,
        approvedAt: expect.any(Date),
        approvedBy: mockUserId,
      });

      expect(mockPayrollLogService.logAction).toHaveBeenCalledWith({
        payrollId,
        action: 'APPROVED',
        previousStatus: PayrollStatus.COMPUTED,
        newStatus: 'APPROVED',
        reason: 'Approved for processing',
        userId: mockUserId,
      });
    });

    it('should throw error if payroll status is not COMPUTED', async () => {
      const payrollId = 'payroll-123';
      const mockPayroll = {
        id: payrollId,
        status: PayrollStatus.APPROVED, // Already approved
        employeeId: mockEmployeeId,
      };

      mockPayrollController.getById.mockResolvedValue(mockPayroll);

      await expect(
        payrollService.approvePayroll(payrollId, mockUserId)
      ).rejects.toThrow('Cannot approve payroll with status APPROVED');
    });
  });

  describe('releasePayroll', () => {
    it('should release payroll successfully', async () => {
      const payrollId = 'payroll-123';
      const mockPayroll = {
        id: payrollId,
        status: PayrollStatus.APPROVED,
        employeeId: mockEmployeeId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-05'),
      };

      mockPayrollController.getById.mockResolvedValue(mockPayroll);
      mockPayrollController.update.mockResolvedValue({
        ...mockPayroll,
        status: PayrollStatus.RELEASED,
        releasedAt: expect.any(Date),
        releasedBy: mockUserId,
      });

      const result = await payrollService.releasePayroll(payrollId, mockUserId, 'Released to employee');

      expect(result.status).toBe(PayrollStatus.RELEASED);
      expect(mockPayrollLogService.logAction).toHaveBeenCalledWith({
        payrollId,
        action: 'RELEASED',
        previousStatus: PayrollStatus.APPROVED,
        newStatus: 'RELEASED',
        reason: 'Released to employee',
        userId: mockUserId,
      });
    });
  });

  describe('voidPayroll', () => {
    it('should void payroll successfully', async () => {
      const payrollId = 'payroll-123';
      const mockPayroll = {
        id: payrollId,
        status: PayrollStatus.APPROVED,
        employeeId: mockEmployeeId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-05'),
      };

      mockPayrollController.getById.mockResolvedValue(mockPayroll);
      mockPayrollController.update.mockResolvedValue({
        ...mockPayroll,
        status: PayrollStatus.VOIDED,
        voidedAt: expect.any(Date),
        voidedBy: mockUserId,
        voidReason: 'Incorrect calculation',
      });

      const result = await payrollService.voidPayroll(payrollId, mockUserId, 'Incorrect calculation');

      expect(result.status).toBe(PayrollStatus.VOIDED);
      expect(mockPayrollLogService.logAction).toHaveBeenCalledWith({
        payrollId,
        action: 'VOIDED',
        previousStatus: PayrollStatus.APPROVED,
        newStatus: 'VOIDED',
        reason: 'Incorrect calculation',
        userId: mockUserId,
      });
    });

    it('should throw error if payroll is already released', async () => {
      const payrollId = 'payroll-123';
      const mockPayroll = {
        id: payrollId,
        status: PayrollStatus.RELEASED,
        employeeId: mockEmployeeId,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-05'),
      };

      mockPayrollController.getById.mockResolvedValue(mockPayroll);

      await expect(
        payrollService.voidPayroll(payrollId, mockUserId, 'Test void')
      ).rejects.toThrow('Cannot void a released payroll');
    });
  });
});
