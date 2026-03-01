import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';
import { seedTaxBrackets } from '../prisma/seeds/taxBrackets';
import { seedPhilhealthContributions } from '../prisma/seeds/philhealthContributions';
import { seedSSSContributions } from '../prisma/seeds/sssContributions';
import { seedPagibigContributions } from '../prisma/seeds/pagibigContributions';

async function seedTestOrganization() {
  try {
    console.log('🔍 Looking for Test Payroll Organization...');
    
    const org = await prisma.organization.findFirst({
      where: { name: 'Test Payroll Organization' }
    });
    
    if (!org) {
      console.log('❌ Test Payroll Organization not found. Please run the test data generation script first.');
      return;
    }
    
    console.log(`✅ Found organization: ${org.name} (${org.id})`);
    
    // Check if government contributions already exist
    const philhealthCount = await prisma.philhealthContribution.count({
      where: { organizationId: org.id }
    });
    
    if (philhealthCount > 0) {
      console.log('✅ Government contributions already exist for this organization.');
    } else {
      console.log('📊 Seeding government contribution rates...');
      
      // Seed government contribution rates
      await seedTaxBrackets(prisma, generateULID, org);
      console.log('✅ Tax brackets seeded');
      
      await seedPhilhealthContributions(prisma, generateULID, org);
      console.log('✅ Philhealth contributions seeded');
      
      await seedSSSContributions(prisma, generateULID, org);
      console.log('✅ SSS contributions seeded');
      
      await seedPagibigContributions(prisma, generateULID, org);
      console.log('✅ Pagibig contributions seeded');
      
      console.log('✅ All government contribution rates seeded successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error seeding test organization:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestOrganization();
