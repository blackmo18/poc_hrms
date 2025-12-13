import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

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

  // Delete in correct order to respect foreign key constraints
  const tables = [
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

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
      console.log(`✅ Cleared ${table}`);
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log(`ℹ️  Table ${table} does not exist - skipping`);
      } else {
        console.log(`⚠️  Could not clear ${table}: ${error.message || error}`);
      }
    }
  }
}

async function dropDatabase() {
  console.log('💣 Dropping all tables...');
  
  try {
    // Get all table names
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    
    // Disable foreign key constraints
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    
    // Drop all tables
    for (const table of tables as any[]) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
      console.log(`💣 Dropped ${table.tablename}`);
    }
    
    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    
    console.log('✅ All tables dropped');
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

  // Create organization using findFirst and create/update pattern
  console.log('🏢 Creating organizations...');
  let organization = await prisma.organization.findFirst({
    where: { name: 'Tech Corp Inc.' }
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Tech Corp Inc.',
        email: 'contact@techcorp.com',
        contact_number: '+1-555-0101',
        address: '123 Business Ave, Tech City, TC 12345',
        website: 'https://techcorp.com',
        description: 'Leading technology solutions provider',
        status: 'ACTIVE',
      },
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
      contact_number: '+1-555-0102',
      address: '456 Financial Plaza, New York, NY 10001',
      website: 'https://globalfinance.com',
      description: 'Premier financial services and consulting firm',
    },
    {
      name: 'Creative Design Studios',
      email: 'hello@creativedesign.com',
      contact_number: '+1-555-0103',
      address: '789 Art District, Los Angeles, CA 90001',
      website: 'https://creativedesign.com',
      description: 'Award-winning design and branding agency',
    },
    {
      name: 'Healthcare Innovations Inc',
      email: 'support@healthcareinnovations.com',
      contact_number: '+1-555-0104',
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
          ...orgData,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Created organization:', orgData.name);
    } else {
      console.log('ℹ️  Organization already exists:', orgData.name);
    }
  }

  // Create roles using upsert to handle existing data
  console.log('👥 Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System administrator with full access',
      organization_id: organization.id,
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { name: 'HR_MANAGER' },
    update: {},
    create: {
      name: 'HR_MANAGER',
      description: 'Human Resources manager with employee management access',
      organization_id: organization.id,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Regular employee with self-service access',
      organization_id: organization.id,
    },
  });

  console.log('✅ Created roles');

  // Create permissions using upsert
  console.log('🔑 Creating permissions...');
  const permissionNames = [
    { name: 'users.create', description: 'Create users' },
    { name: 'users.read', description: 'Read users' },
    { name: 'users.update', description: 'Update users' },
    { name: 'users.delete', description: 'Delete users' },
    { name: 'employees.create', description: 'Create employees' },
    { name: 'employees.read', description: 'Read employees' },
    { name: 'employees.update', description: 'Update employees' },
    { name: 'employees.delete', description: 'Delete employees' },
    { name: 'payroll.process', description: 'Process payroll' },
    { name: 'leave.approve', description: 'Approve leave requests' },
  ];

  const permissions = await Promise.all(
    permissionNames.map(perm => 
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      })
    )
  );

  console.log('✅ Created permissions');

  // Assign permissions to roles using upsert
  console.log('🔗 Assigning permissions to roles...');
  await Promise.all([
    // Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: adminRole.id, permission_id: permission.id } },
        update: {},
        create: { role_id: adminRole.id, permission_id: permission.id }
      })
    ),
    // HR gets employee and leave permissions
    ...permissions.filter(p => p.name.includes('employees') || p.name.includes('leave'))
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: hrRole.id, permission_id: permission.id } },
          update: {},
          create: { role_id: hrRole.id, permission_id: permission.id }
        })
      ),
    // Employee gets read permissions only
    ...permissions.filter(p => p.name.includes('read'))
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: employeeRole.id, permission_id: permission.id } },
          update: {},
          create: { role_id: employeeRole.id, permission_id: permission.id }
        })
      ),
  ]);

  console.log('✅ Assigned permissions to roles');

  // Create departments
  const engineeringDept = await prisma.department.create({
    data: {
      organization_id: organization.id,
      name: 'Engineering',
      description: 'Software development and engineering team',
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      organization_id: organization.id,
      name: 'Human Resources',
      description: 'HR and people operations',
    },
  });

  const salesDept = await prisma.department.create({
    data: {
      organization_id: organization.id,
      name: 'Sales',
      description: 'Sales and business development',
    },
  });

  console.log('✅ Created departments');

  // Create job titles
  const seniorEngineer = await prisma.jobTitle.create({
    data: {
      organization_id: organization.id,
      name: 'Senior Software Engineer',
      description: 'Experienced software engineer',
    },
  });

  const hrManager = await prisma.jobTitle.create({
    data: {
      organization_id: organization.id,
      name: 'HR Manager',
      description: 'Human resources manager',
    },
  });

  const salesRep = await prisma.jobTitle.create({
    data: {
      organization_id: organization.id,
      name: 'Sales Representative',
      description: 'Sales team member',
    },
  });

  console.log('✅ Created job titles');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      organization_id: organization.id,
      email: 'admin@techcorp.com',
      password_hash: hashedPassword,
      status: 'ACTIVE',
    },
  });

  // Assign admin role
  await prisma.userRole.create({
    data: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });

  // Create admin employee record
  const adminEmployee = await prisma.employee.create({
    data: {
      organization_id: organization.id,
      user_id: adminUser.id,
      department_id: hrDept.id,
      job_title_id: hrManager.id,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@techcorp.com',
      employment_status: 'ACTIVE',
      hire_date: new Date('2023-01-01'),
    },
  });

  console.log('✅ Created admin user and employee');

  // Create sample employees
  const employees = await Promise.all([
    // Engineer
    prisma.user.create({
      data: {
        organization_id: organization.id,
        email: 'john.doe@techcorp.com',
        password_hash: await bcrypt.hash('password123', 10),
        status: 'ACTIVE',
      },
    }).then(user =>
      prisma.employee.create({
        data: {
          organization_id: organization.id,
          user_id: user.id,
          department_id: engineeringDept.id,
          job_title_id: seniorEngineer.id,
          manager_id: adminEmployee.id,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@techcorp.com',
          employment_status: 'ACTIVE',
          hire_date: new Date('2023-03-15'),
        },
      })
    ),
    // HR Staff
    prisma.user.create({
      data: {
        organization_id: organization.id,
        email: 'jane.smith@techcorp.com',
        password_hash: await bcrypt.hash('password123', 10),
        status: 'ACTIVE',
      },
    }).then(user =>
      prisma.employee.create({
        data: {
          organization_id: organization.id,
          user_id: user.id,
          department_id: hrDept.id,
          job_title_id: hrManager.id,
          manager_id: adminEmployee.id,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@techcorp.com',
          employment_status: 'ACTIVE',
          hire_date: new Date('2023-02-01'),
        },
      })
    ),
    // Sales Rep
    prisma.user.create({
      data: {
        organization_id: organization.id,
        email: 'mike.johnson@techcorp.com',
        password_hash: await bcrypt.hash('password123', 10),
        status: 'ACTIVE',
      },
    }).then(user =>
      prisma.employee.create({
        data: {
          organization_id: organization.id,
          user_id: user.id,
          department_id: salesDept.id,
          job_title_id: salesRep.id,
          manager_id: adminEmployee.id,
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike.johnson@techcorp.com',
          employment_status: 'ACTIVE',
          hire_date: new Date('2023-04-10'),
        },
      })
    ),
  ]);

  console.log('✅ Created sample employees');

  // Assign employee role to sample employees
  await Promise.all(
    employees.map(employee =>
      prisma.userRole.create({
        data: {
          user_id: employee.user_id!,
          role_id: employeeRole.id,
        },
      })
    )
  );

  // Create sample leave requests
  await prisma.leaveRequest.create({
    data: {
      employee_id: employees[0].id,
      leave_type: 'VACATION',
      start_date: new Date('2024-12-20'),
      end_date: new Date('2024-12-25'),
      status: 'PENDING',
      remarks: 'Christmas vacation',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employee_id: employees[1].id,
      leave_type: 'SICK',
      start_date: new Date('2024-11-15'),
      end_date: new Date('2024-11-16'),
      status: 'APPROVED',
      remarks: 'Flu symptoms',
    },
  });

  console.log('✅ Created sample leave requests');

  // Create sample compensation records
  await Promise.all(
    employees.map(employee =>
      prisma.compensation.create({
        data: {
          employee_id: employee.id,
          base_salary: employee.job_title_id === seniorEngineer.id ? 120000 : 75000,
          pay_frequency: 'MONTHLY',
          effective_date: new Date('2023-01-01'),
        },
      })
    )
  );

  console.log('✅ Created compensation records');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('Admin: admin@techcorp.com / admin123');
  console.log('Employee: john.doe@techcorp.com / password123');
  console.log('HR: jane.smith@techcorp.com / password123');
  console.log('Sales: mike.johnson@techcorp.com / password123');
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
