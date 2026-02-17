import { prisma } from '@/lib/db';

async function checkEmployeeOrg() {
  try {
    // Check the employee you're testing with
    const employee = await prisma.employee.findUnique({
      where: { id: '01KHNAM09HVE3FXZYVFXNWVC5W' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (employee) {
      console.log(`Employee: ${employee.firstName} ${employee.lastName}`);
      console.log(`Email: ${employee.email}`);
      console.log(`Employee ID: ${employee.employeeId}`);
      console.log(`Organization: ${employee.organization.name} (${employee.organization.id})`);
      
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
      const taxCount = await prisma.taxBracket.count({
        where: { organizationId: employee.organizationId }
      });
      
      console.log(`\nGovernment contributions in org:`);
      console.log(`  Philhealth: ${phCount} records`);
      console.log(`  SSS: ${sssCount} records`);
      console.log(`  Pagibig: ${pagibigCount} records`);
      console.log(`  Tax Brackets: ${taxCount} records`);
      
      // Show sample contribution records
      if (phCount > 0) {
        const phSample = await prisma.philhealthContribution.findFirst({
          where: { organizationId: employee.organizationId },
          orderBy: { createdAt: 'desc' }
        });
        console.log(`\nSample Philhealth record:`);
        console.log(`  Salary Range: ₱${phSample?.minSalary} - ₱${phSample?.maxSalary || 'above'}`);
        console.log(`  Employee Rate: ${(phSample?.employeeRate * 100).toFixed(2)}%`);
        console.log(`  Effective From: ${phSample?.effectiveFrom}`);
        console.log(`  Effective To: ${phSample?.effectiveTo || 'present'}`);
      }
    } else {
      console.log('Employee not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeOrg();
