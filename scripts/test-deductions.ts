import { prisma } from '@/lib/db';
import { DIContainer } from '@/lib/di/container';
import { PHDeductionsService } from '@/lib/service/ph-deductions.service';

async function testDeductions() {
  try {
    // Test with the employee's organization
    const employee = await prisma.employee.findUnique({
      where: { id: '01KHNAM09HVE3FXZYVFXNWVC5W' },
      select: {
        organizationId: true,
        organization: {
          select: {
            name: true
          }
        },
        compensations: {
          where: {
            effectiveDate: { lte: new Date() }
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1
        }
      }
    });
    
    if (!employee) {
      console.log('Employee not found!');
      return;
    }
    
    console.log(`Testing deductions for:`);
    console.log(`  Organization: ${employee.organization.name} (${employee.organizationId})`);
    console.log(`  Salary: ₱${employee.compensations[0]?.baseSalary.toLocaleString()}`);
    
    // Test the deductions service directly
    const container = DIContainer.getInstance();
    const phDeductionsService = container.getPHDeductionsService();
    
    const salary = employee.compensations[0]?.baseSalary || 45000;
    console.log(`\nCalculating deductions for salary: ₱${salary.toLocaleString()}`);
    
    const deductions = await phDeductionsService.calculateAllDeductions(
      employee.organizationId,
      salary
    );
    
    console.log(`\nResults:`);
    console.log(`  SSS: ₱${deductions.sss.toLocaleString()}`);
    console.log(`  Philhealth: ₱${deductions.philhealth.toLocaleString()}`);
    console.log(`  Pagibig: ₱${deductions.pagibig.toLocaleString()}`);
    console.log(`  Tax: ₱${deductions.tax.toLocaleString()}`);
    console.log(`  Total: ₱${deductions.totalDeductions.toLocaleString()}`);
    console.log(`  Taxable Income: ₱${deductions.taxableIncome.toLocaleString()}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeductions();
