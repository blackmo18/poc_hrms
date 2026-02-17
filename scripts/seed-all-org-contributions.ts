import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';
import { seedPhilhealthContributions } from '../prisma/seeds/philhealthContributions';
import { seedSSSContributions } from '../prisma/seeds/sssContributions';
import { seedPagibigContributions } from '../prisma/seeds/pagibigContributions';
import { seedTaxBrackets } from '../prisma/seeds/taxBrackets';

/**
 * Script to ensure government contributions are seeded for all organizations
 */

async function seedAllOrgs() {
  try {
    console.log('🔍 Finding all organizations...');
    
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`Found ${organizations.length} organizations:`);
    
    for (const org of organizations) {
      console.log(`\n📊 Processing organization: ${org.name} (${org.id})`);
      
      // Check if contributions already exist
      const phCount = await prisma.philhealthContribution.count({
        where: { organizationId: org.id }
      });
      const sssCount = await prisma.sSSContribution.count({
        where: { organizationId: org.id }
      });
      const pagibigCount = await prisma.pagibigContribution.count({
        where: { organizationId: org.id }
      });
      const taxCount = await prisma.taxBracket.count({
        where: { organizationId: org.id }
      });
      
      console.log(`  Current contributions - PH: ${phCount}, SSS: ${sssCount}, Pagibig: ${pagibigCount}, Tax: ${taxCount}`);
      
      if (phCount === 0) {
        console.log('  ⚠️  No Philhealth contributions found - seeding...');
        await seedPhilhealthContributions(prisma, generateULID, org);
        console.log('  ✅ Philhealth contributions seeded');
      }
      
      if (sssCount === 0) {
        console.log('  ⚠️  No SSS contributions found - seeding...');
        await seedSSSContributions(prisma, generateULID, org);
        console.log('  ✅ SSS contributions seeded');
      }
      
      if (pagibigCount === 0) {
        console.log('  ⚠️  No Pagibig contributions found - seeding...');
        await seedPagibigContributions(prisma, generateULID, org);
        console.log('  ✅ Pagibig contributions seeded');
      }
      
      if (taxCount === 0) {
        console.log('  ⚠️  No tax brackets found - seeding...');
        await seedTaxBrackets(prisma, generateULID, org);
        console.log('  ✅ Tax brackets seeded');
      }
    }
    
    console.log('\n✅ All organizations have been processed!');
    
  } catch (error) {
    console.error('❌ Error seeding contributions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedAllOrgs();
