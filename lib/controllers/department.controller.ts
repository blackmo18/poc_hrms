import { prisma } from '../db';
import { CreateDepartment, UpdateDepartment } from '../models/department';
import { generateULID } from '../utils/ulid.service';

export class DepartmentController {
  async getAll(session: any, organizationId?: string, page: number = 1, limit: number = 15) {
    // Get authenticated user
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
    });

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    // Check permissions
    const isSuperAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    const isAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'ADMIN');
    const isHR = userWithRoles.userRoles.some(ur => ur.role.name === 'HR_MANAGER');

    if (!isSuperAdmin && !isAdmin && !isHR) {
      throw new Error('Access denied');
    }

    // Build where clause
    const where: any = {};

    // Super admin can see all, others only their organization
    if (!isSuperAdmin) {
      where.organizationId = userWithRoles.organization.id;
    } else if (organizationId) {
      // Super admin can filter by organization
      where.organizationId = organizationId;
    }

    // Get total count for pagination
    const total = await prisma.department.count({ where });

    const departments = await prisma.department.findMany({
      where,
      include: {
        organization: true,
        employees: {
          include: {
            jobTitle: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'asc' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: departments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getById(session: any, id: string) {
    // Get authenticated user
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
    });

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    // Check permissions
    const isSuperAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    const isAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'ADMIN');
    const isHR = userWithRoles.userRoles.some(ur => ur.role.name === 'HR_MANAGER');

    if (!isSuperAdmin && !isAdmin && !isHR) {
      throw new Error('Access denied');
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        organization: true,
        employees: {
          include: {
            jobTitle: true,
            manager: true,
          },
        },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Check if user can access this department's organization
    if (!isSuperAdmin && department.organization.id !== userWithRoles.organization.id) {
      throw new Error('Access denied');
    }

    return department;
  }

  async create(session: any, data: CreateDepartment) {
    // Get authenticated user
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
    });

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    // Check permissions - only admin and HR can create
    const isSuperAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    const isAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'ADMIN');
    const isHR = userWithRoles.userRoles.some(ur => ur.role.name === 'HR_MANAGER');

    if (!isSuperAdmin && !isAdmin && !isHR) {
      throw new Error('Access denied');
    }

    // Set organization_id if not super admin
    if (!isSuperAdmin) {
      data.organizationId = userWithRoles.organization.id;
    }

    return await prisma.department.create({
      data: {
        id: generateULID(),
        name: data.name,
        description: data.description,
        organization: { connect: { id: data.organizationId } },
        updatedAt: new Date(),
      },
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async update(session: any, id: string, data: UpdateDepartment) {
    // Get authenticated user
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
    });

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    // Check permissions
    const isSuperAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    const isAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'ADMIN');
    const isHR = userWithRoles.userRoles.some(ur => ur.role.name === 'HR_MANAGER');

    if (!isSuperAdmin && !isAdmin && !isHR) {
      throw new Error('Access denied');
    }

    // Check if department exists and user can access it
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new Error('Department not found');
    }

    if (!isSuperAdmin && existingDepartment.organizationId !== userWithRoles.organization.id) {
      throw new Error('Access denied');
    }

    return await prisma.department.update({
      where: { id },
      data,
      include: {
        organization: true,
        employees: true,
      },
    });
  }

  async delete(session: any, id: string) {
    // Get authenticated user
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get user with roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        organization: true,
      },
    });

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    // Check permissions - only admin and HR can delete
    const isSuperAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN');
    const isAdmin = userWithRoles.userRoles.some(ur => ur.role.name === 'ADMIN');
    const isHR = userWithRoles.userRoles.some(ur => ur.role.name === 'HR_MANAGER');

    if (!isSuperAdmin && !isAdmin && !isHR) {
      throw new Error('Access denied');
    }

    // Check if department exists and user can access it
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new Error('Department not found');
    }

    if (!isSuperAdmin && existingDepartment.organizationId !== userWithRoles.organization.id) {
      throw new Error('Access denied');
    }

    return await prisma.department.delete({
      where: { id },
    });
  }

  // Simple repository method for internal use
  async findByOrganizationId(organizationId: string) {
    return await prisma.department.findMany({
      where: { organizationId }
    });
  }
}

export const departmentController = new DepartmentController();
