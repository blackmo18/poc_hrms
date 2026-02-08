import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedDepartmentsAndJobTitles(prisma: PrismaClient, generateULID: () => string, organization: any, financeOrg: any, designOrg: any, healthcareOrg: any) {
  // === Departments and Job Titles ===
  const engineeringDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Engineering' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Engineering',
      description: 'Software development and engineering team',
      updatedAt: new Date(),
    } as any,
  });

  const hrDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Human Resources' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Human Resources',
      description: 'HR and recruitment team',
      updatedAt: new Date(),
    } as any,
  });

  const salesDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Sales' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Sales',
      description: 'Sales and business development team',
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created departments');

  // Create job titles
  const seniorEngineer = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Senior Software Engineer' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Senior Software Engineer',
      description: 'Experienced software engineer',
      updatedAt: new Date(),
    } as any,
  });

  const hrManager = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'HR Manager' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'HR Manager',
      description: 'Human resources manager',
      updatedAt: new Date(),
    } as any,
  });

  const salesRep = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Sales Representative' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Sales Representative',
      description: 'Sales team member',
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created job titles');

  // Create job titles for additional organizations
  if (financeOrg) {
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: financeOrg.id, name: 'Financial Analyst' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: financeOrg.id,
        name: 'Financial Analyst',
        description: 'Financial analysis and reporting specialist',
        updatedAt: new Date(),
      } as any,
    });
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: financeOrg.id, name: 'Investment Advisor' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: financeOrg.id,
        name: 'Investment Advisor',
        description: 'Investment planning and advisory services',
        updatedAt: new Date(),
      } as any,
    });
  }

  if (designOrg) {
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: designOrg.id, name: 'Senior Designer' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: designOrg.id,
        name: 'Senior Designer',
        description: 'Lead designer with creative direction',
        updatedAt: new Date(),
      } as any,
    });
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: designOrg.id, name: 'UX Researcher' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: designOrg.id,
        name: 'UX Researcher',
        description: 'User experience research and analysis',
        updatedAt: new Date(),
      } as any,
    });
  }

  if (healthcareOrg) {
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: healthcareOrg.id, name: 'Clinical Coordinator' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: healthcareOrg.id,
        name: 'Clinical Coordinator',
        description: 'Healthcare coordination and patient management',
        updatedAt: new Date(),
      } as any,
    });
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: healthcareOrg.id, name: 'Medical Technologist' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: healthcareOrg.id,
        name: 'Medical Technologist',
        description: 'Medical technology and diagnostics specialist',
        updatedAt: new Date(),
      } as any,
    });
  }

  console.log('✅ Created job titles for additional organizations');

  return { engineeringDept, hrDept, salesDept, seniorEngineer, hrManager, salesRep };
}
