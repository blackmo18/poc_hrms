import { BaseRepository } from './base.repository';
import { Organization } from '@prisma/client';

export class OrganizationRepository extends BaseRepository {
  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Organization | null> {
    return this.prisma.organization.findFirst({
      where: { name },
    });
  }

  async findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany();
  }

  async create(data: Omit<Organization, 'created_at' | 'updated_at'>): Promise<Organization> {
    return this.prisma.organization.create({
      data,
    });
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Organization> {
    return this.prisma.organization.delete({
      where: { id },
    });
  }
}

let organizationRepository: OrganizationRepository;

export function getOrganizationRepository(): OrganizationRepository {
  if (!organizationRepository) {
    organizationRepository = new OrganizationRepository();
  }
  return organizationRepository;
}
