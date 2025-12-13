import { prisma } from '../db';
import { CreateEmployee, UpdateEmployee } from '../models/employee';

export class EmployeeController {
  async getAll(organizationId?: number) {
    return await prisma.employee.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
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
    });
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

  async delete(id: number) {
    return await prisma.employee.delete({
      where: { id },
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
