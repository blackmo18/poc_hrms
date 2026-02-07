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
        organization_id: 'org-1',
        department_id: 'dept-1',
        job_title_id: 'job-1',
        manager_id: null,
        calendar_id: null,
        custom_id: null,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        work_email: null,
        work_contact: null,
        personal_address: '123 Main St',
        personal_contact_number: '555-1234',
        personal_email: 'personal@example.com',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Male',
        employment_status: 'ACTIVE',
        hire_date: new Date('2020-01-01'),
        exit_date: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
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
        organization_id: 'org-1',
        department_id: 'dept-1',
        job_title_id: 'job-1',
        manager_id: null,
        calendar_id: null,
        custom_id: null,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        work_email: null,
        work_contact: null,
        personal_address: '123 Main St',
        personal_contact_number: '555-1234',
        personal_email: 'personal@example.com',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Male',
        employment_status: 'ACTIVE',
        hire_date: new Date('2020-01-01'),
        exit_date: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
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
          organization_id: 'org-1',
          department_id: 'dept-1',
          job_title_id: 'job-1',
          manager_id: null,
          calendar_id: null,
          custom_id: null,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          work_email: null,
          work_contact: null,
          personal_address: '123 Main St',
          personal_contact_number: '555-1234',
          personal_email: 'personal@example.com',
          date_of_birth: new Date('1990-01-01'),
          gender: 'Male',
          employment_status: 'ACTIVE',
          hire_date: new Date('2020-01-01'),
          exit_date: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
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
          organization_id: 'org-1',
          department_id: 'dept-1',
          job_title_id: 'job-1',
          manager_id: null,
          calendar_id: null,
          custom_id: null,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          work_email: null,
          work_contact: null,
          personal_address: '123 Main St',
          personal_contact_number: '555-1234',
          personal_email: 'personal@example.com',
          date_of_birth: new Date('1990-01-01'),
          gender: 'Male',
          employment_status: 'ACTIVE',
          hire_date: new Date('2020-01-01'),
          exit_date: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
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
          organization_id: 'org-1',
          department_id: 'dept-1',
          job_title_id: 'job-1',
          manager_id: null,
          calendar_id: null,
          custom_id: null,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          work_email: null,
          work_contact: null,
          personal_address: '123 Main St',
          personal_contact_number: '555-1234',
          personal_email: 'personal@example.com',
          date_of_birth: new Date('1990-01-01'),
          gender: 'Male',
          employment_status: 'ACTIVE',
          hire_date: new Date('2020-01-01'),
          exit_date: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
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

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockEmployees);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(employeeController.getAll).toHaveBeenCalledWith(undefined, { page: 1, limit: 10 });
    });
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createData = {
        organization_id: 'org-1',
        department_id: 'dept-1',
        job_title_id: 'job-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        personal_address: '123 Main St',
        personal_contact_number: '555-1234',
        personal_email: 'personal@example.com',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Male',
        employment_status: 'ACTIVE' as 'ACTIVE',
        hire_date: new Date('2020-01-01'),
      };

      const mockEmployee: Employee = {
        id: 'emp-1',
        organization_id: 'org-1',
        department_id: 'dept-1',
        job_title_id: 'job-1',
        manager_id: null,
        calendar_id: null,
        custom_id: null,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        work_email: null,
        work_contact: null,
        personal_address: '123 Main St',
        personal_contact_number: '555-1234',
        personal_email: 'personal@example.com',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Male',
        employment_status: 'ACTIVE',
        hire_date: new Date('2020-01-01'),
        exit_date: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (employeeController.create as any).mockResolvedValue(mockEmployee);

      const result = await service.create(createData);

      expect(result).toEqual(mockEmployee);
      expect(employeeController.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updateData = { first_name: 'Jane' };
      const mockEmployee: Employee = {
        id: 'emp-1',
        organization_id: 'org-1',
        department_id: 'dept-1',
        job_title_id: 'job-1',
        manager_id: null,
        calendar_id: null,
        custom_id: null,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john@example.com',
        work_email: null,
        work_contact: null,
        personal_address: '123 Main St',
        personal_contact_number: '555-1234',
        personal_email: 'personal@example.com',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Male',
        employment_status: 'ACTIVE',
        hire_date: new Date('2020-01-01'),
        exit_date: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
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
        organization_id: 'org-1',
        department_id: 'dept-1',
        job_title_id: 'job-1',
        manager_id: null,
        calendar_id: null,
        custom_id: null,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        work_email: null,
        work_contact: null,
        personal_address: '123 Main St',
        personal_contact_number: '555-1234',
        personal_email: 'personal@example.com',
        date_of_birth: new Date('1990-01-01'),
        gender: 'Male',
        employment_status: 'ACTIVE',
        hire_date: new Date('2020-01-01'),
        exit_date: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (employeeController.delete as any).mockResolvedValue(mockEmployee);

      const result = await service.delete('emp-1');

      expect(result).toEqual(mockEmployee);
      expect(employeeController.delete).toHaveBeenCalledWith('emp-1');
    });
  });
});
