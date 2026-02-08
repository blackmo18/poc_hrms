import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import bcrypt from 'bcryptjs';

export async function seedEmployeesAndUsers(prisma: PrismaClient, generateULID: () => string, organization: any, systemOrg: any, hrDept: any, hrManager: any, engineeringDept: any, seniorEngineer: any, salesDept: any, salesRep: any, adminRole: any, hrRole: any, employeeRole: any, managerRole: any, superAdminRole: any) {
  // === Employees and Users ===
  // Create admin employee record first
  let adminEmployee = await prisma.employee.findFirst({
    where: { email: 'admin@techcorp.com', organizationId: organization.id }
  });

  if (!adminEmployee) {
    adminEmployee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organizationId: organization.id,
        departmentId: hrDept.id,
        jobTitleId: hrManager.id,
        employeeId: 'ADMIN-001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@techcorp.com',
        hireDate: new Date('2023-01-01'),
        updatedAt: new Date(),
      } as any,
    });
  }

  // Create admin user and link to employee
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@techcorp.com' },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      email: 'admin@techcorp.com',
      passwordHash: hashedPassword,
      status: 'ACTIVE',
      employeeId: adminEmployee.id,
      updatedAt: new Date(),
    } as any,
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    } as any,
    update: {},
    create: {
      id: generateULID(),
      userId: adminUser.id,
      roleId: adminRole.id,
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created admin user and employee');

  // Create system department and job title for super admin
  const systemDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: systemOrg!.id, name: 'System Administration' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: systemOrg!.id,
      name: 'System Administration',
      description: 'System administration department',
      updatedAt: new Date(),
    } as any,
  });

  const systemJobTitle = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: systemOrg!.id, name: 'System Administrator' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: systemOrg!.id,
      name: 'System Administrator',
      description: 'System administrator role',
      updatedAt: new Date(),
    } as any
  });

  // Create super admin employee record FIRST
  let superAdminEmployee = await prisma.employee.findFirst({
    where: { email: 'superadmin@hrsystem.com', organizationId: systemOrg!.id }
  });

  if (!superAdminEmployee) {
    superAdminEmployee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organizationId: systemOrg!.id,
        departmentId: systemDept.id,
        jobTitleId: systemJobTitle.id,
        employeeId: "SUPERADMIN-001",
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@hrsystem.com',
        hireDate: new Date('2023-01-01'),
        updatedAt: new Date(),
      } as any,
    });
  }

  // Create super admin user AFTER employee exists
  const superAdminHashedPassword = await bcrypt.hash('superadmin123', 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@hrsystem.com' },
    update: {},
    create: {
      id: generateULID(),
      organizationId: systemOrg!.id,
      email: 'superadmin@hrsystem.com',
      passwordHash: superAdminHashedPassword,
      status: 'ACTIVE',
      employeeId: superAdminEmployee.id,
      updatedAt: new Date(),
    } as any,
  });

  // Assign super admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    } as any,
    update: {},
    create: {
      id: generateULID(),
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created super admin user and employee');

  // Create sample employees
  const employees = await Promise.all([
    // Engineer
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'john.doe@techcorp.com', organizationId: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organizationId: organization.id,
            departmentId: engineeringDept.id,
            jobTitleId: seniorEngineer.id,
            managerId: adminEmployee.id,
            employeeId: 'ENG-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@techcorp.com',
            hireDate: new Date('2023-03-15'),
          } as any,
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'john.doe@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organizationId: organization.id,
          email: 'john.doe@techcorp.com',
          passwordHash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employeeId: employee.id,
        } as any,
      });

      return { ...employee, userId: user.id };
    })(),
    // HR Staff
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'jane.smith@techcorp.com', organizationId: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organizationId: organization.id,
            departmentId: hrDept.id,
            jobTitleId: hrManager.id,
            managerId: adminEmployee.id,
            employeeId: 'HR-001',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@techcorp.com',
            hireDate: new Date('2023-02-01'),
          } as any,
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'jane.smith@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organizationId: organization.id,
          email: 'jane.smith@techcorp.com',
          passwordHash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employeeId: employee.id,
        } as any,
      });

      return { ...employee, userId: user.id };
    })(),
    // Sales Rep
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'mike.johnson@techcorp.com', organizationId: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organizationId: organization.id,
            departmentId: salesDept.id,
            jobTitleId: salesRep.id,
            managerId: adminEmployee.id,
            employeeId: 'SALES-001',
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@techcorp.com',
            hireDate: new Date('2023-04-10'),
          } as any,
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'mike.johnson@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organizationId: organization.id,
          email: 'mike.johnson@techcorp.com',
          passwordHash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employeeId: employee.id,
        } as any,
      });

      return { ...employee, userId: user.id };
    })(),
  ]);

  console.log('✅ Created sample employees');

  // Assign roles to sample employees
  await Promise.all(
    employees.map((employee, index) => {
      let roleId;
      if (index === 1) {
        roleId = hrRole.id;
      } else if (index === 0) {
        roleId = managerRole.id; // First employee gets manager role
      } else {
        roleId = employeeRole.id;
      }
      return prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: employee.userId,
            roleId: roleId,
          },
        } as any,
        update: {},
        create: {
          id: generateULID(),
          userId: employee.userId,
          roleId: roleId,
        } as any,
      });
    })
  );

  return { employees, adminEmployee };
}
