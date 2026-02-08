import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedOrganizations(prisma: PrismaClient, generateULID: () => string) {
  // === Organizations ===
  console.log('🏢 Creating system organization...');
  let systemOrg = await prisma.organization.findFirst({
    where: { name: 'System' }
  });

  if (!systemOrg) {
    systemOrg = await prisma.organization.create({
      data: {
        id: generateULID(),
        name: 'System',
        email: 'system@hrsystem.com',
        contactNumber: '+1-555-0000',
        address: 'System Administration',
        website: 'https://hrsystem.com',
        description: 'System administration organization',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    console.log('✅ Created system organization');
  } else {
    console.log('✅ Using existing system organization');
  }

  // Create organization using findFirst and create/update pattern
  let organization = await prisma.organization.findFirst({
    where: { name: 'Tech Corp Inc.' }
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        id: generateULID(),
        name: 'Tech Corp Inc.',
        email: 'contact@techcorp.com',
        contactNumber: '+1-555-0101',
        address: '123 Business Ave, Tech City, TC 12345',
        website: 'https://techcorp.com',
        description: 'Leading technology solutions provider',
        status: 'ACTIVE',
        updatedAt: new Date(),
      } as any,
    });
    console.log('✅ Created new organization:', organization.name);
  } else {
    console.log('✅ Using existing organization:', organization.name);
  }

  // Create 3 additional organizations
  const additionalOrgs = [
    {
      name: 'Global Finance Solutions',
      email: 'info@globalfinance.com',
      contactNumber: '+1-555-0102',
      address: '456 Financial Plaza, New York, NY 10001',
      website: 'https://globalfinance.com',
      description: 'Premier financial services and consulting firm',
    },
    {
      name: 'Creative Design Studios',
      email: 'hello@creativedesign.com',
      contactNumber: '+1-555-0103',
      address: '789 Art District, Los Angeles, CA 90001',
      website: 'https://creativedesign.com',
      description: 'Award-winning design and branding agency',
    },
    {
      name: 'Healthcare Innovations Inc',
      email: 'support@healthcareinnovations.com',
      contactNumber: '+1-555-0104',
      address: '321 Medical Center, Boston, MA 02101',
      website: 'https://healthcareinnovations.com',
      description: 'Cutting-edge healthcare technology solutions',
    },
  ];

  for (const orgData of additionalOrgs) {
    const existingOrg = await prisma.organization.findFirst({
      where: { name: orgData.name }
    });

    if (!existingOrg) {
      await prisma.organization.create({
        data: {
          id: generateULID(),
          ...orgData,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
      console.log('✅ Created organization:', orgData.name);
    } else {
      console.log('ℹ️  Organization already exists:', orgData.name);
    }
  }

  // Find additional orgs for later use
  const financeOrg = await prisma.organization.findFirst({
    where: { name: 'Global Finance Solutions' }
  });
  const designOrg = await prisma.organization.findFirst({
    where: { name: 'Creative Design Studios' }
  });
  const healthcareOrg = await prisma.organization.findFirst({
    where: { name: 'Healthcare Innovations Inc' }
  });

  return { systemOrg, organization, financeOrg, designOrg, healthcareOrg };
}
