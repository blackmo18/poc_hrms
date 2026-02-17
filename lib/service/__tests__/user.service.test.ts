import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../user.service';
import { userController } from '@/lib/controllers/user.controller';
import { User } from '@prisma/client';

// Mock the controller
vi.mock('@/lib/controllers/user.controller', () => ({
  userController: {
    getById: vi.fn(),
    getByEmail: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getUserPermissions: vi.fn(),
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('UserService', () => {
  let service: UserService;
  let bcryptCompareMock: any;
  let bcryptHashMock: any;

  beforeEach(async () => {
    service = new UserService();
    vi.clearAllMocks();

    // Set up bcrypt mocks
    const bcryptModule = await import('bcryptjs');
    bcryptCompareMock = vi.mocked(bcryptModule.default.compare);
    bcryptHashMock = vi.mocked(bcryptModule.default.hash);
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        password_hash: 'hashed',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        organizationId: 'org-1',
        employee_id: null,
      };

      (userController.getById as any).mockResolvedValue(mockUser);

      const result = await service.getById('user-1');

      expect(result).toEqual(mockUser);
      expect(userController.getById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getByEmail', () => {
    it('should return user by email', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        password_hash: 'hashed',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        organizationId: 'org-1',
        employee_id: null,
      };

      (userController.getByEmail as any).mockResolvedValue(mockUser);

      const result = await service.getByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userController.getByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('getByOrganizationId', () => {
    it('should return users by organization id', async () => {
      const mockUsers: User[] = [
        {
          id: 'user-1',
          email: 'test@example.com',
          emailVerified: null,
          image: null,
          password_hash: 'hashed',
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
          organizationId: 'org-1',
          employee_id: null,
        },
      ];

      (userController.getAll as any).mockResolvedValue({ data: mockUsers });

      const result = await service.getByOrganizationId('org-1');

      expect(result).toEqual(mockUsers);
      expect(userController.getAll).toHaveBeenCalledWith('org-1', undefined);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'new@example.com',
        organizationId: 'org-1',
        employee_id: 'emp-1',
        role_ids: ['role-1'],
        status: 'ACTIVE' as 'ACTIVE',
        generated_password: 'password123',
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'new@example.com',
        emailVerified: null,
        image: null,
        password_hash: 'hashed',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        organizationId: 'org-1',
        employee_id: 'emp-1',
      };

      (userController.create as any).mockResolvedValue(mockUser);

      const result = await service.create(createData);

      expect(result).toEqual(mockUser);
      expect(userController.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { email: 'updated@example.com' };
      const mockUser: User = {
        id: 'user-1',
        email: 'updated@example.com',
        emailVerified: null,
        image: null,
        password_hash: 'hashed',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        organizationId: 'org-1',
        employee_id: null,
      };

      (userController.update as any).mockResolvedValue(mockUser);

      const result = await service.update('user-1', updateData);

      expect(result).toEqual(mockUser);
      expect(userController.update).toHaveBeenCalledWith('user-1', updateData);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: null,
        image: null,
        password_hash: 'hashed',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        organizationId: 'org-1',
        employee_id: null,
      };

      (userController.delete as any).mockResolvedValue(mockUser);

      const result = await service.delete('user-1');

      expect(result).toEqual(mockUser);
      expect(userController.delete).toHaveBeenCalledWith('user-1');
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      bcryptCompareMock.mockResolvedValue(true);

      const result = await service.verifyPassword('password123', 'hashed');

      expect(result).toBe(true);
      expect(bcryptCompareMock).toHaveBeenCalledWith('password123', 'hashed');
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      bcryptHashMock.mockResolvedValue('hashed');

      const result = await service.hashPassword('password123');

      expect(result).toBe('hashed');
      expect(bcryptHashMock).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const permissions = ['read', 'write'];

      (userController.getUserPermissions as any).mockResolvedValue(permissions);

      const result = await service.getUserPermissions('user-1');

      expect(result).toEqual(permissions);
      expect(userController.getUserPermissions).toHaveBeenCalledWith('user-1');
    });
  });
});
