import { prisma } from '../db';
import { CreateEmployee, UpdateEmployee } from '../models/employee';
import { generateULID } from '../utils/ulid.service';

export class EmployeeController {
  async getAll(organizationId?: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 15 } = options || {};
    const skip = (page - 1) * limit;

    // First get the total count
    const total = await prisma.employee.count({
      where: organizationId ? { organization_id: organizationId } : undefined,
    });

    // Then fetch the paginated employees
    const employees = await prisma.employee.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      skip,
      take: limit,
      include: {
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
        created_at: 'desc'
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
        timesheets: true,
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
      data: {id: generateULID(), ...data},
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
      where: { department_id: departmentId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }

  async getByManager(managerId: string) {
    return await prisma.employee.findMany({
      where: { manager_id: managerId },
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
        organization_id: organizationId,
        OR: [
          { first_name: { startsWith: query, mode: 'insensitive' as const } },
          { last_name: { startsWith: query, mode: 'insensitive' as const } },
          { custom_id: { startsWith: query, mode: 'insensitive' as const } },
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
    // First get the user to find their employee_id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employee_id: true },
    });

    if (!user || !user.employee_id) {
      return null;
    }

    // Then fetch the employee using the employee_id
    return await prisma.employee.findUnique({
      where: { id: user.employee_id },
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
        timesheets: true,
        leaveRequests: true,
        payrolls: {
          include: {
            deductions: true,
          },
        },
      },
    });
  }
}

export const employeeController = new EmployeeController();
