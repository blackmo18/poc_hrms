import { describe, it, expect, vi, beforeEach } from 'vitest';
import { employeeController } from '@/lib/controllers/employee.controller';
import { prisma } from '@/lib/db';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    employee: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('EmployeeController - Filter Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll with organization and department filtering', () => {
    const mockEmployees = [
      {
        id: 'emp1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        employeeId: 'EMP001',
        employmentStatus: 'ACTIVE',
        hireDate: new Date('2023-01-01'),
        exitDate: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        organization: { id: 'org1', name: 'Tech Corp' },
        department: { id: 'dept1', name: 'Engineering' },
        jobTitle: { id: 'title1', name: 'Developer' },
      },
      {
        id: 'emp2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        employeeId: 'EMP002',
        employmentStatus: 'ACTIVE',
        hireDate: new Date('2023-01-02'),
        exitDate: null,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        organization: { id: 'org1', name: 'Tech Corp' },
        department: { id: 'dept1', name: 'Engineering' },
        jobTitle: { id: 'title2', name: 'Designer' },
      },
    ];

    it('should filter employees by organization ID only', async () => {
      // Arrange
      const organizationId = 'org1';
      const mockCount = 2;
      
      (prisma.employee.count as any).mockResolvedValue(mockCount);
      (prisma.employee.findMany as any).mockResolvedValue(mockEmployees);

      // Act
      const result = await employeeController.getAll(organizationId, undefined, { page: 1, limit: 15 });

      // Assert
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
      });
      
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        skip: 0,
        take: 15,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockEmployees,
        pagination: {
          page: 1,
          limit: 15,
          total: mockCount,
          totalPages: Math.ceil(mockCount / 15),
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should filter employees by department ID only', async () => {
      // Arrange
      const departmentId = 'dept1';
      const mockCount = 2;
      
      (prisma.employee.count as any).mockResolvedValue(mockCount);
      (prisma.employee.findMany as any).mockResolvedValue(mockEmployees);

      // Act
      const result = await employeeController.getAll(undefined, departmentId, { page: 1, limit: 15 });

      // Assert
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { departmentId: 'dept1' },
      });
      
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { departmentId: 'dept1' },
        skip: 0,
        take: 15,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockEmployees,
        pagination: {
          page: 1,
          limit: 15,
          total: mockCount,
          totalPages: Math.ceil(mockCount / 15),
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should filter employees by both organization ID and department ID', async () => {
      // Arrange
      const organizationId = 'org1';
      const departmentId = 'dept1';
      const mockCount = 2;
      
      (prisma.employee.count as any).mockResolvedValue(mockCount);
      (prisma.employee.findMany as any).mockResolvedValue(mockEmployees);

      // Act
      const result = await employeeController.getAll(organizationId, departmentId, { page: 1, limit: 15 });

      // Assert
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: 'org1', departmentId: 'dept1' },
      });
      
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1', departmentId: 'dept1' },
        skip: 0,
        take: 15,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockEmployees,
        pagination: {
          page: 1,
          limit: 15,
          total: mockCount,
          totalPages: Math.ceil(mockCount / 15),
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should return all employees when no filters are provided', async () => {
      // Arrange
      const mockCount = 10;
      
      (prisma.employee.count as any).mockResolvedValue(mockCount);
      (prisma.employee.findMany as any).mockResolvedValue(mockEmployees);

      // Act
      const result = await employeeController.getAll(undefined, undefined, { page: 1, limit: 15 });

      // Assert
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: undefined,
      });
      
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 15,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockEmployees,
        pagination: {
          page: 1,
          limit: 15,
          total: mockCount,
          totalPages: Math.ceil(mockCount / 15),
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should handle pagination correctly with filters', async () => {
      // Arrange
      const organizationId = 'org1';
      const departmentId = 'dept1';
      const page = 2;
      const limit = 5;
      const mockCount = 12;
      
      (prisma.employee.count as any).mockResolvedValue(mockCount);
      (prisma.employee.findMany as any).mockResolvedValue(mockEmployees);

      // Act
      const result = await employeeController.getAll(organizationId, departmentId, { page, limit });

      // Assert
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: 'org1', departmentId: 'dept1' },
      });
      
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1', departmentId: 'dept1' },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
        take: 5,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockEmployees,
        pagination: {
          page: 2,
          limit: 5,
          total: mockCount,
          totalPages: Math.ceil(mockCount / 5),
          hasNext: true, // 2 * 5 < 12
          hasPrev: true, // 2 > 1
        },
      });
    });

    it('should handle empty results correctly', async () => {
      // Arrange
      const organizationId = 'org1';
      const departmentId = 'dept1';
      const mockCount = 0;
      
      (prisma.employee.count as jest.Mock).mockResolvedValue(mockCount);
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await employeeController.getAll(organizationId, departmentId, { page: 1, limit: 15 });

      // Assert
      expect(prisma.employee.count).toHaveBeenCalledWith({
        where: { organizationId: 'org1', departmentId: 'dept1' },
      });
      
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1', departmentId: 'dept1' },
        skip: 0,
        take: 15,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 15,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    });
  });
});
