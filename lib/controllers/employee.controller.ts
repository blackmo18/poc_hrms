import { prisma } from '../db';
import { CreateEmployee, UpdateEmployee } from '../models/employee';

export class EmployeeController {
  async getAll(organizationId?: number, options?: { page?: number; limit?: number }) {
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
        organization: true,
        user: true,
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
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      data: employees.map(emp => ({
        id: emp.public_id,
        organization: {
          id: emp.organization.public_id,
          name: emp.organization.name,
        },
        department: {
          id: emp.department.public_id,
          name: emp.department.name,
        },
        jobTitle: {
          id: emp.jobTitle.public_id,
          name: emp.jobTitle.name,
        },
        manager: emp.manager ? {
          id: emp.manager.public_id,
          first_name: emp.manager.first_name,
          last_name: emp.manager.last_name,
        } : null,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        work_email: emp.work_email,
        work_contact: emp.work_contact,
        personal_address: emp.personal_address,
        personal_contact_number: emp.personal_contact_number,
        personal_email: emp.personal_email,
        date_of_birth: emp.date_of_birth,
        gender: emp.gender,
        employment_status: emp.employment_status,
        hire_date: emp.hire_date,
        exit_date: emp.exit_date,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
      })),
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

  async getById(id: number) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        organization: true,
        user: true,
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

  async getByPublicId(public_id: string) {
    const emp = await prisma.employee.findUnique({
      where: { public_id },
      include: {
        organization: true,
        user: true,
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

    if (!emp) return null;

    return {
      id: emp.public_id,
      organization: {
        id: emp.organization.public_id,
        name: emp.organization.name,
      },
      department: {
        id: emp.department.public_id,
        name: emp.department.name,
      },
      jobTitle: {
        id: emp.jobTitle.public_id,
        name: emp.jobTitle.name,
      },
      manager: emp.manager ? {
        id: emp.manager.public_id,
        first_name: emp.manager.first_name,
        last_name: emp.manager.last_name,
      } : null,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      work_email: emp.work_email,
      work_contact: emp.work_contact,
      personal_address: emp.personal_address,
      personal_contact_number: emp.personal_contact_number,
      personal_email: emp.personal_email,
      date_of_birth: emp.date_of_birth,
      gender: emp.gender,
      employment_status: emp.employment_status,
      hire_date: emp.hire_date,
      exit_date: emp.exit_date,
      created_at: emp.created_at,
      updated_at: emp.updated_at,
      directReports: emp.directReports.map(dr => ({
        id: dr.public_id,
        first_name: dr.first_name,
        last_name: dr.last_name,
      })),
    };
  }

  async create(data: CreateEmployee) {
    return await prisma.employee.create({
      data,
      include: {
        organization: true,
        user: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
      },
    });
  }

  async update(id: number, data: UpdateEmployee) {
    return await prisma.employee.update({
      where: { id },
      data,
      include: {
        organization: true,
        user: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
      },
    });
  }

  async updateByPublicId(public_id: string, data: UpdateEmployee) {
    return await prisma.employee.update({
      where: { public_id },
      data,
      include: {
        organization: true,
        user: true,
        department: true,
        jobTitle: true,
        manager: true,
        directReports: true,
      },
    });
  }

  async delete(id: number) {
    return await prisma.employee.delete({
      where: { id },
    });
  }

  async deleteByPublicId(public_id: string) {
    return await prisma.employee.delete({
      where: { public_id },
    });
  }

  async getByDepartment(departmentId: number) {
    return await prisma.employee.findMany({
      where: { department_id: departmentId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }

  async getByManager(managerId: number) {
    return await prisma.employee.findMany({
      where: { manager_id: managerId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }

  async getByUserId(userId: number) {
    return await prisma.employee.findUnique({
      where: { user_id: userId },
      include: {
        organization: true,
        user: true,
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
