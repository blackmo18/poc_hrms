import { prisma } from '../db';
import { CreateEmployee, UpdateEmployee } from '../models/employee';

export class EmployeeController {
  async getAll(organizationId?: bigint) {
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

  async getById(id: bigint) {
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

  async update(id: bigint, data: UpdateEmployee) {
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

  async delete(id: bigint) {
    return await prisma.employee.delete({
      where: { id },
    });
  }

  async getByDepartment(departmentId: bigint) {
    return await prisma.employee.findMany({
      where: { department_id: departmentId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }

  async getByManager(managerId: bigint) {
    return await prisma.employee.findMany({
      where: { manager_id: managerId },
      include: {
        department: true,
        jobTitle: true,
        manager: true,
      },
    });
  }
}

export const employeeController = new EmployeeController();
