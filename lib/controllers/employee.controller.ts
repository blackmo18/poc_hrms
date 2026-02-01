import { prisma } from '../db';
import { CreateEmployee, UpdateEmployee } from '../models/employee';
import { generateULID } from '../utils/ulid.service';

export class EmployeeController {
  async getAll(organizationId?: string, departmentId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // Build where clause based on provided filters
    const whereClause: any = {};
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    // First get the total count
    const total = await prisma.employee.count({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    });

    // Then fetch the paginated employees
    const employees = await prisma.employee.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        employmentStatus: true,
        hireDate: true,
        exitDate: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        jobTitle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getById(id: string) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        organization: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
        compensations: true,
        employeeBenefits: {
          include: {
            benefit: true,
          },
        },
        timeEntries: true,
        leaveRequests: true,
        payrolls: {
          include: {
            deductions: true,
          },
        },
      },
    });
  }

  async create(data: CreateEmployee) {
    return await prisma.employee.create({
      data: {
        id: generateULID(),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        hireDate: data.hireDate,
        exitDate: data.exitDate,
        employmentStatus: data.employmentStatus,
        organization: { connect: { id: data.organizationId } },
        department: { connect: { id: data.departmentId } },
        jobTitle: { connect: { id: data.jobTitleId } },
        updatedAt: new Date(),
      },
      include: {
        organization: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
      },
    });
  }

  async update(id: string, data: UpdateEmployee) {
    return await prisma.employee.update({
      where: { id },
      data,
      include: {
        organization: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.employee.delete({
      where: { id },
    });
  }

  async getByDepartment(departmentId: string) {
    return await prisma.employee.findMany({
      where: { departmentId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }

  async getByManager(managerId: string) {
    return await prisma.employee.findMany({
      where: { managerId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }

  async search(organizationId: string, query: string, limit: number = 10) {
    return await prisma.employee.findMany({
      where: {
        organizationId,
        OR: [
          { firstName: { startsWith: query, mode: 'insensitive' as const } },
          { lastName: { startsWith: query, mode: 'insensitive' as const } },
          { email: { startsWith: query, mode: 'insensitive' as const } },
        ],
      },
      include: {
        jobTitle: true,
      },
      take: limit,
    });
  }

  async getByUserId(userId: string) {
    // First get the user to find their employeeId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user || !user.employeeId) {
      return null;
    }

    // Then fetch the employee using the employeeId
    return await prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: {
        organization: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
        compensations: true,
        employeeBenefits: {
          include: {
            benefit: true,
          },
        },
        timeEntries: true,
        leaveRequests: true,
        payrolls: {
          include: {
            deductions: true,
          },
        },
      },
    });
  }

  // Simple repository methods for internal use
  async findByDepartmentId(departmentId: string) {
    return await prisma.employee.findMany({
      where: { departmentId }
    });
  }
}

export const employeeController = new EmployeeController();
