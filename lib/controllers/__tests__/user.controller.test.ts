import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserController } from '../user.controller';
import { prisma } from '@/lib/db';
import { User } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
    },
    userRole: {
      createMany: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
    },
  },
}));

describe('UserController', () => {
  let controller: UserController;

  beforeEach(() => {
    controller = new UserController();
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        status: 'ACTIVE' as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        organizationId: 'org-1',
        employeeId: 'emp-1',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await controller.getById('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        status: 'ACTIVE' as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        organizationId: 'org-1',
        employeeId: 'emp-1',
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await controller.getByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: expect.any(Object),
      });
    });
  });

  describe('getAll', () => {
    it('should return paginated users without organization filter', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: 'hashed',
          status: 'ACTIVE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: 'org-1',
          employeeId: 'emp-1',
        },
      ];

      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue(mockUsers);

      const result = await controller.getAll();

      expect(result).toEqual({
        data: mockUsers,
        pagination: {
          total: 1,
          page: 1,
          limit: 15,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
      expect(prisma.user.count).toHaveBeenCalledWith(expect.any(Object));
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 15,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return paginated users with organization filter', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          passwordHash: 'hashed',
          status: 'ACTIVE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: 'org-1',
          employeeId: 'emp-1',
        },
      ];

      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue(mockUsers);

      const result = await controller.getAll('org-1', { page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockUsers,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'new@example.com',
        organizationId: 'org-1',
        employeeId: 'emp-1',
        roleIds: ['role-1'],
        status: 'ACTIVE' as 'ACTIVE',
        generatedPassword: 'password123',
      };

      const mockEmployee = {
        id: 'emp-1',
        organization: { id: 'org-1' },
      };

      const mockUser = {
        id: 'user-1',
        email: 'new@example.com',
        passwordHash: 'hashed',
        status: 'ACTIVE' as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        organizationId: 'org-1',
        employeeId: 'emp-1',
      };

      (prisma.employee.findUnique as any).mockResolvedValue(mockEmployee);
      (prisma.userRole.createMany as any).mockResolvedValue(undefined);
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await controller.create(createData);

      expect(result).toEqual(mockUser);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        include: { organization: true },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            employeeId: 'emp-1',
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { email: 'updated@example.com' };
      const mockUser = {
        id: 'user-1',
        email: 'updated@example.com',
        passwordHash: 'hashed',
        status: 'ACTIVE' as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        organizationId: 'org-1',
        employeeId: 'emp-1',
      };

      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await controller.update('user-1', updateData);

      expect(result).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updateData,
        include: expect.any(Object),
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        status: 'ACTIVE' as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        organizationId: 'org-1',
        employeeId: 'emp-1',
      };

      (prisma.user.delete as any).mockResolvedValue(mockUser);

      const result = await controller.delete('user-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const mockUserWithRoles = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        status: 'ACTIVE' as const,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        organizationId: 'org-1',
        employeeId: 'emp-1',
        userRoles: [
          { roleId: 'role-1' },
          { roleId: 'role-2' },
        ],
      };

      const mockPermissions = [
        { permission: { name: 'read' } },
        { permission: { name: 'write' } },
      ];

      (prisma.user.findUnique as any).mockResolvedValue(mockUserWithRoles);
      (prisma.rolePermission.findMany as any).mockResolvedValue(mockPermissions);

      const result = await controller.getUserPermissions('user-1');

      expect(result).toEqual(['read', 'write']);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: expect.any(Object),
      });
      expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: { permission: true },
      });
    });
  });
});
