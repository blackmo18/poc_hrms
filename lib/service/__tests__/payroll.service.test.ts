import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollService } from '../payroll.service';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { Payroll } from '@prisma/client';

// Mock the controller
vi.mock('@/lib/controllers/payroll.controller', () => ({
  payrollController: {
    getById: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('PayrollService', () => {
  let service: PayrollService;

  beforeEach(() => {
    service = new PayrollService();
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return payroll by id', async () => {
      const mockPayroll: any = {
        id: 'payroll-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        grossPay: 5000.00,
        netPay: 4500.00,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (payrollController.getById as any).mockResolvedValue(mockPayroll);

      const result = await service.getById('payroll-1');

      expect(result).toEqual(mockPayroll);
      expect(payrollController.getById).toHaveBeenCalledWith('payroll-1');
    });
  });

  describe('getByEmployeeId', () => {
    it('should return payrolls by employee id', async () => {
      const mockPayrolls: any[] = [
        {
          id: 'payroll-1',
          employeeId: 'emp-1',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          grossPay: 5000.00,
          netPay: 4500.00,
          processedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'payroll-2',
          employeeId: 'emp-2',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          grossPay: 6000.00,
          netPay: 5400.00,
          processedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (payrollController.getAll as any).mockResolvedValue(mockPayrolls);

      const result = await service.getByEmployeeId('emp-1');

      expect(result).toEqual([mockPayrolls[0]]);
      expect(payrollController.getAll).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return paginated payrolls', async () => {
      const mockPayrolls: any[] = [
        {
          id: 'payroll-1',
          employeeId: 'emp-1',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          grossPay: 5000.00,
          netPay: 4500.00,
          processedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'payroll-2',
          employeeId: 'emp-2',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          grossPay: 6000.00,
          netPay: 5400.00,
          processedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (payrollController.getAll as any).mockResolvedValue(mockPayrolls);

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockPayrolls);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(payrollController.getAll).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const mockPayrolls: any[] = Array.from({ length: 25 }, (_, i) => ({
        id: `payroll-${i + 1}`,
        employeeId: `emp-${i + 1}`,
        organizationId: 'org-1',
        departmentId: 'dept-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        grossPay: 5000.00,
        netPay: 4500.00,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (payrollController.getAll as any).mockResolvedValue(mockPayrolls);

      const result = await service.getAll({ page: 2, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe('payroll-11');
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('create', () => {
    it('should create a new payroll', async () => {
      const createData = {
        employeeId: 'emp-1',
        organizationId: 'org-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        grossPay: 5000.00,
        netPay: 4500.00,
      };

      const mockPayroll: any = {
        id: 'payroll-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        grossPay: 5000.00,
        netPay: 4500.00,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (payrollController.create as any).mockResolvedValue(mockPayroll);

      const result = await service.create(createData);

      expect(result).toEqual(mockPayroll);
      expect(payrollController.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('update', () => {
    it('should update a payroll', async () => {
      const updateData = { netPay: 4600.00 };
      const mockPayroll: any = {
        id: 'payroll-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        grossPay: 5000.00,
        netPay: 4600.00,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (payrollController.update as any).mockResolvedValue(mockPayroll);

      const result = await service.update('payroll-1', updateData);

      expect(result).toEqual(mockPayroll);
      expect(payrollController.update).toHaveBeenCalledWith('payroll-1', updateData);
    });
  });

  describe('delete', () => {
    it('should delete a payroll', async () => {
      const mockPayroll: any = {
        id: 'payroll-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        grossPay: 5000.00,
        netPay: 4500.00,
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (payrollController.delete as any).mockResolvedValue(mockPayroll);

      const result = await service.delete('payroll-1');

      expect(result).toEqual(mockPayroll);
      expect(payrollController.delete).toHaveBeenCalledWith('payroll-1');
    });
  });
});
