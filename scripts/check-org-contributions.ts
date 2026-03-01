import { prisma } from '@/lib/db';

async function checkOrgs() {
  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true
    }
  });
  
  console.log('Organizations:');
  orgs.forEach(org => {
    console.log(`  ${org.id}: ${org.name}`);
  });
  
  // Check employee org
  const employee = await prisma.employee.findUnique({
    where: { id: '01KHNAM09HVE3FXZYVFXNWVC5W' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      organizationId: true,
      employeeId: true
    }
  });
  
  if (employee) {
    console.log(`\nEmployee ${employee.firstName} ${employee.lastName} belongs to org: ${employee.organizationId}`);
    
    // Check if org has contributions
    const phCount = await prisma.philhealthContribution.count({
      where: { organizationId: employee.organizationId }
    });
    const sssCount = await prisma.sSSContribution.count({
      where: { organizationId: employee.organizationId }
    });
    const pagibigCount = await prisma.pagibigContribution.count({
      where: { organizationId: employee.organizationId }
    });
    
    console.log(`Government contributions in org:`);
    console.log(`  Philhealth: ${phCount} records`);
    console.log(`  SSS: ${sssCount} records`);
    console.log(`  Pagibig: ${pagibigCount} records`);
  }
  
  await prisma.$disconnect();
}

checkOrgs().catch(console.error);
