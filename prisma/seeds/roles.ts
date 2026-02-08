import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedRoles(prisma: PrismaClient, generateULID: () => string, organization: any, systemOrg: any) {
  // === Roles and Permissions ===
  // Create roles using findFirst and create pattern to handle organization-specific roles
  console.log('👥 Creating roles...');

  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', organizationId: organization.id }
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'ADMIN',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let hrRole = await prisma.role.findFirst({
    where: { name: 'HR_MANAGER', organizationId: organization.id }
  });
  if (!hrRole) {
    hrRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'HR_MANAGER',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let employeeRole = await prisma.role.findFirst({
    where: { name: 'EMPLOYEE', organizationId: organization.id }
  });
  if (!employeeRole) {
    employeeRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'EMPLOYEE',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let managerRole = await prisma.role.findFirst({
    where: { name: 'MANAGER', organizationId: organization.id }
  });
  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'MANAGER',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', organizationId: systemOrg!.id }
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'SUPER_ADMIN',
        organizationId: systemOrg!.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  console.log('✅ Created roles');

  return { adminRole, hrRole, employeeRole, managerRole, superAdminRole };
}
