import { PrismaClient } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';

export async function seedPayrollPeriods(
  prisma: PrismaClient,
  generateULID: () => string,
  organization: any
) {
  console.log('🌱 Seeding payroll periods...');

  const currentYear = new Date().getFullYear();
  const periods = [];

  // Generate monthly payroll periods for the current year
  for (let month = 1; month <= 12; month++) {
    // Get first and last day of month
    const startDate = new Date(currentYear, month - 1, 1);
    const endDate = new Date(currentYear, month, 0); // Last day of month
    
    // Pay date is typically 5th of next month
    const payDate = new Date(currentYear, month, 5);
    
    // Adjust if payDate falls on weekend
    if (payDate.getDay() === 0) { // Sunday
      payDate.setDate(payDate.getDate() + 1);
    } else if (payDate.getDay() === 6) { // Saturday
      payDate.setDate(payDate.getDate() + 2);
    }

    const period = {
      startDate,
      endDate,
      organizationId: organization.id,
      payDate,
      status: month < new Date().getMonth() + 1 ? 'COMPLETED' : 
              month === new Date().getMonth() + 1 ? 'PROCESSING' : 'PENDING',
      type: 'MONTHLY',
      year: currentYear,
      month: month,
      periodNumber: 1,
    };

    periods.push(period);
  }

  // Also create some semi-monthly periods
  for (let month = 1; month <= 3; month++) { // Just for first quarter as example
    // First cutoff: 1st to 15th
    const firstStartDate = new Date(currentYear, month - 1, 1);
    const firstEndDate = new Date(currentYear, month - 1, 15);
    const firstPayDate = new Date(currentYear, month - 1, 20);
    
    // Adjust if payDate falls on weekend
    if (firstPayDate.getDay() === 0) {
      firstPayDate.setDate(firstPayDate.getDate() + 1);
    } else if (firstPayDate.getDay() === 6) {
      firstPayDate.setDate(firstPayDate.getDate() + 2);
    }

    periods.push({
      startDate: firstStartDate,
      endDate: firstEndDate,
      organizationId: organization.id,
      payDate: firstPayDate,
      status: 'COMPLETED',
      type: 'SEMI_MONTHLY',
      year: currentYear,
      month: month,
      periodNumber: 1,
    });

    // Second cutoff: 16th to end of month
    const secondStartDate = new Date(currentYear, month - 1, 16);
    const secondEndDate = new Date(currentYear, month, 0);
    const secondPayDate = new Date(currentYear, month, 5);
    
    // Adjust if payDate falls on weekend
    if (secondPayDate.getDay() === 0) {
      secondPayDate.setDate(secondPayDate.getDate() + 1);
    } else if (secondPayDate.getDay() === 6) {
      secondPayDate.setDate(secondPayDate.getDate() + 2);
    }

    periods.push({
      startDate: secondStartDate,
      endDate: secondEndDate,
      organizationId: organization.id,
      payDate: secondPayDate,
      status: 'COMPLETED',
      type: 'SEMI_MONTHLY',
      year: currentYear,
      month: month,
      periodNumber: 2,
    });
  }

  // Create periods in database using upsert to handle existing data
  for (const period of periods) {
    await prisma.payrollPeriod.upsert({
      where: {
        organizationId_startDate_endDate: {
          organizationId: period.organizationId,
          startDate: period.startDate,
          endDate: period.endDate,
        },
      },
      update: period,
      create: period,
    });
  }

  console.log(`✅ Created ${periods.length} payroll periods`);
  return periods;
}
