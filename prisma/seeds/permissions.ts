import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedPermissions(prisma: PrismaClient, generateULID: () => string, organization: any, systemOrg: any, adminRole: any, hrRole: any, employeeRole: any, managerRole: any, superAdminRole: any) {
  // === Permissions ===
  // Create permissions using upsert
  console.log('🔑 Creating permissions...');
  const permissionNames = [
    { name: 'users.create', description: 'Create users', organizationId: systemOrg!.id },
    { name: 'users.read', description: 'Read users', organizationId: systemOrg!.id },
    { name: 'users.update', description: 'Update users', organizationId: systemOrg!.id },
    { name: 'users.delete', description: 'Delete users', organizationId: systemOrg!.id },
    { name: 'employees.create', description: 'Create employees', organizationId: organization.id },
    { name: 'employees.read', description: 'Read employees', organizationId: organization.id },
    { name: 'employees.update', description: 'Update employees', organizationId: organization.id },
    { name: 'employees.delete', description: 'Delete employees', organizationId: organization.id },
    { name: 'payroll.create', description: 'Create payroll', organizationId: organization.id },
    { name: 'payroll.read', description: 'Read payroll', organizationId: organization.id },
    { name: 'payroll.update', description: 'Update payroll', organizationId: organization.id },
    { name: 'payroll.delete', description: 'Delete payroll', organizationId: organization.id },
    { name: 'payroll.process', description: 'Process payroll', organizationId: organization.id },
    { name: 'payroll.approve', description: 'Approve payroll', organizationId: organization.id },
    { name: 'payroll.release', description: 'Release payroll', organizationId: organization.id },
    { name: 'payroll.void', description: 'Void payroll', organizationId: organization.id },
    { name: 'leave.approve', description: 'Approve leave requests', organizationId: organization.id },
    { name: 'timesheet.own', description: 'Manage own timesheet', organizationId: organization.id },
    { name: 'timesheet.own.read', description: 'Read own timesheet', organizationId: organization.id },
    { name: 'timesheet.admin.read', description: 'Read all timesheets', organizationId: organization.id },
    { name: 'overtime.request', description: 'File overtime request', organizationId: organization.id },
    { name: 'overtime.approve', description: 'Approve/reject overtime requests', organizationId: organization.id },
    { name: 'timeoff.request', description: 'File time off request', organizationId: organization.id },
    { name: 'timeoff.approve', description: 'Approve/reject time off requests', organizationId: organization.id },
  ];

  const permissions = await Promise.all(
    permissionNames.map(perm => {
      const id = generateULID();
      return prisma.permission.upsert({
        where: { id } as any,
        update: {},
        create: {
          id,
          ...perm,
        } as any,
      });
    })
  );

  console.log('✅ Created permissions');

  // Assign permissions to roles using upsert
  console.log('🔗 Assigning permissions to roles...');
  await Promise.all([
    // Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } } as any,
        update: {},
        create: {
          id: generateULID(),
          roleId: adminRole.id,
          permissionId: permission.id,
          updatedAt: new Date(),
        } as any
      })
    ),
    // HR gets employee, leave, and timesheet permissions
    ...permissions.filter(p => p.name.includes('employees') || p.name.includes('leave') || p.name.includes('timesheet'))
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: hrRole.id, permissionId: permission.id } } as any,
          update: {},
          create: {
            id: generateULID(),
            roleId: hrRole.id,
            permissionId: permission.id,
            updatedAt: new Date(),
          } as any
        })
      ),
    // Employee gets read permissions, own timesheet, and request permissions
    ...permissions.filter(p =>
      p.name.includes('read') ||
      p.name.includes('timesheet.own') ||
      p.name.includes('overtime.request') ||
      p.name.includes('timeoff.request')
    )
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } } as any,
          update: {},
          create: {
            id: generateULID(),
            roleId: employeeRole.id,
            permissionId: permission.id,
            updatedAt: new Date(),
          } as any
        })
      ),
    // Manager gets all employee permissions plus approval permissions
    ...permissions.filter(p =>
      p.name.includes('employees.read') ||
      p.name.includes('timesheet') ||
      p.name.includes('overtime') ||
      p.name.includes('timeoff') ||
      p.name.includes('leave')
    )
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permission.id } } as any,
          update: {},
          create: {
            id: generateULID(),
            roleId: managerRole.id,
            permissionId: permission.id,
            updatedAt: new Date(),
          } as any
        })
      ),
    // Super Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } } as any,
        update: {},
        create: {
          id: generateULID(),
          roleId: superAdminRole.id,
          permissionId: permission.id,
          updatedAt: new Date(),
        } as any
      })
    ),
  ]);

  console.log('✅ Assigned permissions to roles');
}
