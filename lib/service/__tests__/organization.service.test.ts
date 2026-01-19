import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from '../organization.service';
import { organizationController } from '@/lib/controllers/organization.controller';
import { Organization } from '@prisma/client';

// Mock the controller
vi.mock('@/lib/controllers/organization.controller', () => ({
  organizationController: {
    getById: vi.fn(),
    findByName: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(() => {
    service = new OrganizationService();
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return organization by id', async () => {
      const mockOrg: Organization = {
        id: 'org-1',
        name: 'Test Organization',
        email: 'test@example.com',
        contact_number: '555-1234',
        address: '123 Main St',
        logo: null,
        website: 'https://example.com',
        description: 'A test organization',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (organizationController.getById as any).mockResolvedValue(mockOrg);

      const result = await service.getById('org-1');

      expect(result).toEqual(mockOrg);
      expect(organizationController.getById).toHaveBeenCalledWith('org-1');
    });
  });

  describe('getByName', () => {
    it('should return organization by name', async () => {
      const mockOrg: Organization = {
        id: 'org-1',
        name: 'Test Organization',
        email: 'test@example.com',
        contact_number: '555-1234',
        address: '123 Main St',
        logo: null,
        website: 'https://example.com',
        description: 'A test organization',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (organizationController.findByName as any).mockResolvedValue(mockOrg);

      const result = await service.getByName('Test Organization');

      expect(result).toEqual(mockOrg);
      expect(organizationController.findByName).toHaveBeenCalledWith('Test Organization');
    });
  });

  describe('getAll', () => {
    it('should return paginated organizations', async () => {
      const mockOrgs: Organization[] = [
        {
          id: 'org-1',
          name: 'Test Organization',
          email: 'test@example.com',
          contact_number: '555-1234',
          address: '123 Main St',
          logo: null,
          website: 'https://example.com',
          description: 'A test organization',
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
        },
      ];

      (organizationController.getAll as any).mockResolvedValue({
        data: mockOrgs,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      const result = await service.getAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockOrgs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(organizationController.getAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const createData = {
        name: 'New Organization',
        email: 'new@example.com',
        status: 'ACTIVE' as 'ACTIVE',
        contact_number: '555-5678',
        address: '456 Oak St',
      };

      const mockOrg: Organization = {
        id: 'org-1',
        name: 'New Organization',
        email: 'new@example.com',
        contact_number: '555-5678',
        address: '456 Oak St',
        logo: null,
        website: null,
        description: null,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (organizationController.create as any).mockResolvedValue(mockOrg);

      const result = await service.create(createData);

      expect(result).toEqual(mockOrg);
      expect(organizationController.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const updateData = { name: 'Updated Organization' };
      const mockOrg: Organization = {
        id: 'org-1',
        name: 'Updated Organization',
        email: 'test@example.com',
        contact_number: '555-1234',
        address: '123 Main St',
        logo: null,
        website: 'https://example.com',
        description: 'A test organization',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (organizationController.update as any).mockResolvedValue(mockOrg);

      const result = await service.update('org-1', updateData);

      expect(result).toEqual(mockOrg);
      expect(organizationController.update).toHaveBeenCalledWith('org-1', updateData);
    });
  });

  describe('delete', () => {
    it('should delete an organization', async () => {
      const mockOrg: Organization = {
        id: 'org-1',
        name: 'Test Organization',
        email: 'test@example.com',
        contact_number: '555-1234',
        address: '123 Main St',
        logo: null,
        website: 'https://example.com',
        description: 'A test organization',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      };

      (organizationController.delete as any).mockResolvedValue(mockOrg);

      const result = await service.delete('org-1');

      expect(result).toEqual(mockOrg);
      expect(organizationController.delete).toHaveBeenCalledWith('org-1');
    });
  });
});
