import { prisma } from '../lib/db';

async function resetPayrollPeriod(organizationId: string, periodStart: string, periodEnd: string) {
  console.log(`Resetting payroll records for organization: ${organizationId}`);
  console.log(`Period: ${periodStart} to ${periodEnd}`);
  
  try {
    // Delete deduction records first (due to foreign key constraint)
    const deletedDeductions = await prisma.deduction.deleteMany({
      where: {
        payroll: {
          organizationId,
          periodStart: {
            gte: new Date(periodStart),
          },
          periodEnd: {
            lte: new Date(periodEnd),
          },
        },
      },
    });
    
    console.log(`Deleted ${deletedDeductions.count} deduction records`);
    
    // Delete earning records
    const deletedEarnings = await prisma.payrollEarning.deleteMany({
      where: {
        payroll: {
          organizationId,
          periodStart: {
            gte: new Date(periodStart),
          },
          periodEnd: {
            lte: new Date(periodEnd),
          },
        },
      },
    });
    
    console.log(`Deleted ${deletedEarnings.count} earning records`);
    
    // Delete payroll records
    const deletedPayrolls = await prisma.payroll.deleteMany({
      where: {
        organizationId,
        periodStart: {
          gte: new Date(periodStart),
        },
        periodEnd: {
          lte: new Date(periodEnd),
        },
      },
    });
    
    console.log(`Deleted ${deletedPayrolls.count} payroll records`);
    console.log('✅ Payroll period reset successfully!');
    
  } catch (error) {
    console.error('Error resetting payroll period:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const organizationId = process.argv[2];
  const periodStart = process.argv[3];
  const periodEnd = process.argv[4];
  
  if (!organizationId || !periodStart || !periodEnd) {
    console.log('Usage: npx tsx scripts/reset-payroll-period.ts <organizationId> <periodStart> <periodEnd>');
    console.log('Example: npx tsx scripts/reset-payroll-period.ts org-123 2026-01-16 2026-01-31');
    process.exit(1);
  }
  
  resetPayrollPeriod(organizationId, periodStart, periodEnd)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { resetPayrollPeriod };
