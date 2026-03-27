import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { generateULID } from '@/lib/utils/ulid.service';
import { seedOrganizations } from './seeds/organizations';
import { seedRoles } from './seeds/roles';
import { seedPermissions } from './seeds/permissions';
import { seedDepartmentsAndJobTitles } from './seeds/departments';
import { seedEmployeesAndUsers } from './seeds/employees';
import { seedLeaveRequests } from './seeds/leaveRequests';
import { seedCompensation } from './seeds/compensation';
import { seedTimeEntries } from './seeds/timeEntries';
import { seedHolidays } from './seeds/holidays';
import { seedTaxBrackets } from './seeds/taxBrackets';
import { seedPhilhealthContributions } from './seeds/philhealthContributions';
import { seedSSSContributions } from './seeds/sssContributions';
import { seedPagibigContributions } from './seeds/pagibigContributions';
import { seedEmployeeGovernmentInfo } from './seeds/employeeGovernmentInfo';
import { seedLateDeductionPolicies } from './seeds/lateDeductionPolicies';
import { seedWorkSchedules } from './seeds/workSchedules';
import { seedPayrollPeriods } from './seeds/payrollPeriods';

// Load .env.local (which could be from .env or Vercel depending on the command used)
config({ path: '.env.local' });

// Debug: Show which database we're connecting to
const dbUrl = process.env.DATABASE_URL;
console.log('Database URL:', dbUrl);
const isVercel = dbUrl?.includes('neon') || dbUrl?.includes('vercel');
console.log('🔗 Database:', isVercel ? 'Vercel/Neon Database' : 'Local Database');
console.log('🚀 Environment:', process.env.NODE_ENV || 'development');

const prisma = new PrismaClient();

// Database operations
async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  // First check if any tables exist
  try {
    const result = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 1`;
    if (!result || (result as any[]).length === 0) {
      console.log('ℹ️  No tables found - database is empty');
      return;
    }
  } catch (error) {
    console.log('ℹ️  Could not check table existence, proceeding anyway...');
  }

  // Tables to truncate - in dependency order (child tables first)
  const tables = [
    'time_break',
    'timeEntry',
    'payroll_earning',
    'deduction',
    'work_schedule',
    'late_deduction_policy',
    'payroll_period',
    'employee_government_info',
    'pagibig_contribution',
    'sss_contribution',
    'philhealth_contribution',
    'tax_bracket',
    'leave_request',
    'compensation', 
    'user_role',
    'role_permission',
    'employee',
    'user',
    'job_title',
    'department',
    'permission',
    'role',
    'organization'
  ];

  // First, disable foreign key constraints temporarily
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

  // Truncate all tables to reset auto-increment IDs
  for (const table of tables) {
    try {
      // Check if table exists first
      const tableExists = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      
      if (tableExists[0].exists) {
        const result = await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✅ Truncated ${table}`);
      } else {
        console.log(`ℹ️  Table ${table} does not exist - skipping`);
      }
    } catch (error: any) {
      console.log(`⚠️  Could not truncate ${table}: ${error.message || error}`);
    }
  }

  // Re-enable foreign key constraints
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
  
  // Verify payroll_period table is empty
  const periodCount = await prisma.payrollPeriod.count().catch(() => 0);
  console.log(`📊 Payroll periods count after truncate: ${periodCount}`);
}

async function dropDatabase() {
  console.log('💣 Dropping all tables...');
  
  try {
    // 1. Get all table names in the 'public' schema
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    
    // 2. Drop all tables using CASCADE
    // CASCADE removes the foreign key constraints automatically 
    // without needing superuser replication privileges.
    for (const { tablename } of tables) {
      // Skip the migrations table so you don't break Prisma's history
      if (tablename === '_prisma_migrations') continue;

      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${tablename}" CASCADE;`);
      console.log(`💣 Dropped ${tablename}`);
    }
    
    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  // Check if data already exists and clean if needed
  try {
    const existingOrg = await prisma.organization.findFirst();
    if (existingOrg) {
      console.log('🔍 Existing data found. Cleaning before seeding...');
      await cleanDatabase();
      console.log('✅ Cleaned existing data. Proceeding with fresh seed...');
    } else {
      console.log('📝 Database appears to be empty. Proceeding with seed...');
    }
  } catch (error: any) {
    if (error.code === '42P01') {
      console.log('📝 Tables do not exist. Database needs schema setup.');
      console.log('💡 Please run "npm run db:push" first to create tables.');
      return;
    } else {
      console.log('⚠️  Could not check existing data, proceeding anyway...');
    }
  }

  // Seed organizations
  const { systemOrg, organization, financeOrg, designOrg, healthcareOrg } = await seedOrganizations(prisma, generateULID);

  // Seed roles
  const { adminRole, hrRole, employeeRole, managerRole, superAdminRole } = await seedRoles(prisma, generateULID, organization, systemOrg);

  // Seed permissions
  await seedPermissions(prisma, generateULID, organization, systemOrg, adminRole, hrRole, employeeRole, managerRole, superAdminRole);

  // Seed departments and job titles
  const { engineeringDept, hrDept, salesDept, seniorEngineer, hrManager, salesRep } = await seedDepartmentsAndJobTitles(prisma, generateULID, organization, financeOrg, designOrg, healthcareOrg);

  // Seed employees and users
  const { employees, adminEmployee } = await seedEmployeesAndUsers(prisma, generateULID, organization, systemOrg, hrDept, hrManager, engineeringDept, seniorEngineer, salesDept, salesRep, adminRole, hrRole, employeeRole, managerRole, superAdminRole);

  // Seed leave requests
  await seedLeaveRequests(prisma, generateULID, employees, organization, adminEmployee);

  // Seed compensation
  await seedCompensation(prisma, generateULID, employees, organization, seniorEngineer);
  
  // Get the created compensations for work schedules
  const compensations = await prisma.compensation.findMany({
    where: { organizationId: organization.id },
    take: employees.length,
  });

  // Seed holidays
  await seedHolidays(prisma, generateULID, systemOrg);

  // Seed government contributions
  await seedTaxBrackets(prisma, generateULID, organization);
  await seedPhilhealthContributions(prisma, generateULID, organization);
  await seedSSSContributions(prisma, generateULID, organization);
  await seedPagibigContributions(prisma, generateULID, organization);
  
  // Seed employee government information
  await seedEmployeeGovernmentInfo(prisma, generateULID, employees, organization);

  // Seed new payroll-related entities
  await seedLateDeductionPolicies(prisma, generateULID, organization);
  await seedWorkSchedules(prisma, generateULID, organization, employees, compensations);
  await seedPayrollPeriods(prisma, generateULID, organization);
  
  // Seed time entries for payroll testing
  await seedTimeEntries();

  console.log('🎉 Database seeding completed successfully!');

  console.log('');
  console.log('Login credentials:');
  console.log('Super Admin: superadmin@hrsystem.com / superadmin123');
  console.log('Admin: admin@techcorp.com / admin123');
  console.log('Manager: john.doe@techcorp.com / password123');
  console.log('Employee: mike.johnson@techcorp.com / password123');
  console.log('HR: jane.smith@techcorp.com / password123');
}

// Main execution with command-line arguments
async function main() {
  const command = process.argv[2];
  const force = process.argv.includes('--force');
  
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log('');

  switch (command) {
    case 'clean':
      await cleanDatabase();
      break;
    case 'drop':
      await dropDatabase();
      break;
    case 'seed':
      if (force) {
        console.log('💪 Force mode: Skipping existing data check...');
        await seedDatabase();
      } else {
        await seedDatabase();
      }
      break;
    case 'reset':
      await cleanDatabase();
      await seedDatabase();
      break;
    case 'full-reset':
      await dropDatabase();
      // Wait a moment for tables to be fully dropped
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Re-create schema (you'll need to run prisma db push first)
      console.log('⚠️  Run "npm run db:push" to recreate schema, then "npm run db:seed" to seed data');
      break;
    default:
      console.log('📋 Available commands:');
      console.log('  npm run db:seed clean    - Clean all data from tables');
      console.log('  npm run db:seed drop     - Drop all tables');
      console.log('  npm run db:seed seed     - Seed database with default data');
      console.log('  npm run db:seed reset    - Clean and reseed database');
      console.log('  npm run db:seed full-reset - Drop tables, recreate schema, and seed');
      console.log('  npm run db:seed --force  - Force seed without cleanup check');
      console.log('');
      console.log('🔄 Default: Running seed operation...');
      await seedDatabase();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
