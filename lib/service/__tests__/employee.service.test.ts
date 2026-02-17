import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmployeeService } from '../employee.service';
import { employeeController } from '@/lib/controllers/employee.controller';
import { Employee } from '@prisma/client';

// Mock the controller
vi.mock('@/lib/controllers/employee.controller', () => ({
  employeeController: {
    getById: vi.fn(),
    getByUserId: vi.fn(),
    getAll: vi.fn(),
    getByDepartment: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(() => {
    service = new EmployeeService();
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return employee by id', async () => {
      const mockEmployee: Employee = {
        id: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        jobTitleId: 'job-1',
        managerId: null,
        calendarId: null,
        employeeId: null,
        employmentStatus: 'ACTIVE',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date('2020-01-01'),
        exitDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (employeeController.getById as any).mockResolvedValue(mockEmployee);

      const result = await service.getById('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeController.getById).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('getByUserId', () => {
    it('should return employee by user id', async () => {
      const mockEmployee: Employee = {
        id: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        jobTitleId: 'job-1',
        managerId: null,
        calendarId: null,
        employeeId: null,
        employmentStatus: 'ACTIVE',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date('2020-01-01'),
        exitDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (employeeController.getByUserId as any).mockResolvedValue(mockEmployee);

      const result = await service.getByUserId('user-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeController.getByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getByOrganizationId', () => {
    it('should return employees by organization id', async () => {
      const mockEmployees: Employee[] = [
        {
          id: 'emp-1',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          jobTitleId: 'job-1',
          managerId: null,
          calendarId: null,
          employeeId: null,
          employmentStatus: 'ACTIVE',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          hireDate: new Date('2020-01-01'),
          exitDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (employeeController.getAll as any).mockResolvedValue({ data: mockEmployees });

      const result = await service.getByOrganizationId('org-1');

      expect(result).toEqual(mockEmployees);
      expect(employeeController.getAll).toHaveBeenCalledWith('org-1');
    });
  });

  describe('getByDepartmentId', () => {
    it('should return employees by department id', async () => {
      const mockEmployees: Employee[] = [
        {
          id: 'emp-1',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          jobTitleId: 'job-1',
          managerId: null,
          calendarId: null,
          employeeId: null,
          employmentStatus: 'ACTIVE',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          hireDate: new Date('2020-01-01'),
          exitDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (employeeController.getByDepartment as any).mockResolvedValue(mockEmployees);

      const result = await service.getByDepartmentId('dept-1');

      expect(result).toEqual(mockEmployees);
      expect(employeeController.getByDepartment).toHaveBeenCalledWith('dept-1');
    });
  });

  describe('getAll', () => {
    it('should return paginated employees', async () => {
      const mockEmployees: Employee[] = [
        {
          id: 'emp-1',
          organizationId: 'org-1',
          departmentId: 'dept-1',
          jobTitleId: 'job-1',
          managerId: null,
          calendarId: null,
          employeeId: null,
          employmentStatus: 'ACTIVE',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          hireDate: new Date('2020-01-01'),
          exitDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (employeeController.getAll as any).mockResolvedValue({
        data: mockEmployees,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      const result = await service.getAll(undefined, undefined, { page: 1, limit: 10 });

      expect(result.data).toEqual(mockEmployees);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(employeeController.getAll).toHaveBeenCalledWith(undefined, undefined, { page: 1, limit: 10 });
    });
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createData = {
        organizationId: 'org-1',
        departmentId: 'dept-1',
        jobTitleId: 'job-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        personalAddress: '123 Main St',
        personalContactNumber: '555-1234',
        personalEmail: 'personal@example.com',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        employmentStatus: 'ACTIVE' as 'ACTIVE',
        hireDate: new Date('2020-01-01'),
      };

      const mockEmployee: Employee = {
        id: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        jobTitleId: 'job-1',
        managerId: null,
        calendarId: null,
        employeeId: null,
        employmentStatus: 'ACTIVE',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date('2020-01-01'),
        exitDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (employeeController.create as any).mockResolvedValue(mockEmployee);

      const result = await service.create(createData);

      expect(result).toEqual(mockEmployee);
      expect(employeeController.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updateData = { firstName: 'Jane' };
      const mockEmployee: Employee = {
        id: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        jobTitleId: 'job-1',
        managerId: null,
        calendarId: null,
        employeeId: null,
        employmentStatus: 'ACTIVE',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date('2020-01-01'),
        exitDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (employeeController.update as any).mockResolvedValue(mockEmployee);

      const result = await service.update('emp-1', updateData);

      expect(result).toEqual(mockEmployee);
      expect(employeeController.update).toHaveBeenCalledWith('emp-1', updateData);
    });
  });

  describe('delete', () => {
    it('should delete an employee', async () => {
      const mockEmployee: Employee = {
        id: 'emp-1',
        organizationId: 'org-1',
        departmentId: 'dept-1',
        jobTitleId: 'job-1',
        managerId: null,
        calendarId: null,
        employeeId: null,
        employmentStatus: 'ACTIVE',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date('2020-01-01'),
        exitDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (employeeController.delete as any).mockResolvedValue(mockEmployee);

      const result = await service.delete('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeController.delete).toHaveBeenCalledWith('emp-1');
    });
  });
});
