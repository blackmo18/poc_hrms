import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { generateULID } from '@/lib/utils/ulid.service';

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

  // Create system organization first
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
        contact_number: '+1-555-0000',
        address: 'System Administration',
        website: 'https://hrsystem.com',
        description: 'System administration organization',
        status: 'ACTIVE',
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
          id: generateULID(),
          ...orgData,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Created organization:', orgData.name);
    } else {
      console.log('ℹ️  Organization already exists:', orgData.name);
    }
  }

  // Create roles using findFirst and create pattern to handle organization-specific roles
  console.log('👥 Creating roles...');
  
  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', organization_id: organization.id }
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'ADMIN',
        description: 'System administrator with full access',
        organization_id: organization.id,
      },
    });
  }

  let hrRole = await prisma.role.findFirst({
    where: { name: 'HR_MANAGER', organization_id: organization.id }
  });
  if (!hrRole) {
    hrRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'HR_MANAGER',
        description: 'Human Resources manager with employee management access',
        organization_id: organization.id,
      },
    });
  }

  let employeeRole = await prisma.role.findFirst({
    where: { name: 'EMPLOYEE', organization_id: organization.id }
  });
  if (!employeeRole) {
    employeeRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'EMPLOYEE',
        description: 'Regular employee with self-service access',
        organization_id: organization.id,
      },
    });
  }

  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', organization_id: systemOrg!.id }
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'SUPER_ADMIN',
        description: 'System super administrator with full system access',
        organization_id: systemOrg!.id,
      },
    });
  }

  console.log('✅ Created roles');

  // Create permissions using upsert
  console.log('🔑 Creating permissions...');
  const permissionNames = [
    { name: 'users.create', description: 'Create users', organization_id: systemOrg!.id },
    { name: 'users.read', description: 'Read users', organization_id: systemOrg!.id },
    { name: 'users.update', description: 'Update users', organization_id: systemOrg!.id },
    { name: 'users.delete', description: 'Delete users', organization_id: systemOrg!.id },
    { name: 'employees.create', description: 'Create employees', organization_id: organization.id },
    { name: 'employees.read', description: 'Read employees', organization_id: organization.id },
    { name: 'employees.update', description: 'Update employees', organization_id: organization.id },
    { name: 'employees.delete', description: 'Delete employees', organization_id: organization.id },
    { name: 'payroll.process', description: 'Process payroll', organization_id: organization.id },
    { name: 'leave.approve', description: 'Approve leave requests', organization_id: organization.id },
  ];

  const permissions = await Promise.all(
    permissionNames.map(perm => 
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: {
          id: generateULID(),
          ...perm,
        },
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
        create: {
          id: generateULID(),
          role_id: adminRole.id,
          permission_id: permission.id
        }
      })
    ),
    // HR gets employee and leave permissions
    ...permissions.filter(p => p.name.includes('employees') || p.name.includes('leave'))
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: hrRole.id, permission_id: permission.id } },
          update: {},
          create: {
            id: generateULID(),
            role_id: hrRole.id,
            permission_id: permission.id
          }
        })
      ),
    // Employee gets read permissions only
    ...permissions.filter(p => p.name.includes('read'))
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: employeeRole.id, permission_id: permission.id } },
          update: {},
          create: {
            id: generateULID(),
            role_id: employeeRole.id,
            permission_id: permission.id
          }
        })
      ),
    // Super Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: superAdminRole.id, permission_id: permission.id } },
        update: {},
        create: {
          id: generateULID(),
          role_id: superAdminRole.id,
          permission_id: permission.id
        }
      })
    ),
  ]);

  console.log('✅ Assigned permissions to roles');

  // Create departments
  const engineeringDept = await prisma.department.create({
    data: {
      id: generateULID(),
      organization_id: organization.id,
      name: 'Engineering',
      description: 'Software development and engineering team',
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      id: generateULID(),
      organization_id: organization.id,
      name: 'Human Resources',
      description: 'HR and people operations',
    },
  });

  const salesDept = await prisma.department.create({
    data: {
      id: generateULID(),
      organization_id: organization.id,
      name: 'Sales',
      description: 'Sales and business development',
    },
  });

  console.log('✅ Created departments');

  // Create job titles
  const seniorEngineer = await prisma.jobTitle.create({
    data: {
      id: generateULID(),
      organization_id: organization.id,
      name: 'Senior Software Engineer',
      description: 'Experienced software engineer',
    },
  });

  const hrManager = await prisma.jobTitle.create({
    data: {
      id: generateULID(),
      organization_id: organization.id,
      name: 'HR Manager',
      description: 'Human resources manager',
    },
  });

  const salesRep = await prisma.jobTitle.create({
    data: {
      id: generateULID(),
      organization_id: organization.id,
      name: 'Sales Representative',
      description: 'Sales team member',
    },
  });

  console.log('✅ Created job titles');

  // Create job titles for additional organizations
  const financeOrg = await prisma.organization.findFirst({
    where: { name: 'Global Finance Solutions' }
  });
  const designOrg = await prisma.organization.findFirst({
    where: { name: 'Creative Design Studios' }
  });
  const healthcareOrg = await prisma.organization.findFirst({
    where: { name: 'Healthcare Innovations Inc' }
  });

  if (financeOrg) {
    await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organization_id: financeOrg.id,
        name: 'Financial Analyst',
        description: 'Financial analysis and reporting specialist',
      },
    });
    await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organization_id: financeOrg.id,
        name: 'Investment Advisor',
        description: 'Investment planning and advisory services',
      },
    });
  }

  if (designOrg) {
    await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organization_id: designOrg.id,
        name: 'Senior Designer',
        description: 'Lead designer with creative direction',
      },
    });
    await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organization_id: designOrg.id,
        name: 'UX Researcher',
        description: 'User experience research and analysis',
      },
    });
  }

  if (healthcareOrg) {
    await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organization_id: healthcareOrg.id,
        name: 'Clinical Coordinator',
        description: 'Healthcare coordination and patient management',
      },
    });
    await prisma.jobTitle.create({
      data: {
        id: generateULID(),
        organization_id: healthcareOrg.id,
        name: 'Medical Technologist',
        description: 'Medical technology and diagnostics specialist',
      },
    });
  }

  console.log('✅ Created job titles for additional organizations');

  // Create admin employee record first
  let adminEmployee = await prisma.employee.findFirst({
    where: { email: 'admin@techcorp.com', organization_id: organization.id }
  });

  if (!adminEmployee) {
    adminEmployee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organization_id: organization.id,
        department_id: hrDept.id,
        job_title_id: hrManager.id,
        custom_id: 'ADMIN-001',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@techcorp.com',
        work_email: 'admin.work@techcorp.com',
        work_contact: '+1-555-0001',
        personal_address: '100 Corporate Blvd, Tech City, TC 12345',
        personal_contact_number: '+1-555-0002',
        personal_email: 'admin.personal@techcorp.com',
        date_of_birth: new Date('1985-01-01'),
        gender: 'Other',
        employment_status: 'ACTIVE',
        hire_date: new Date('2023-01-01'),
      },
    });
  }

  // Create admin user and link to employee
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@techcorp.com' },
    update: {},
    create: {
      id: generateULID(),
      organization_id: organization.id,
      email: 'admin@techcorp.com',
      password_hash: hashedPassword,
      status: 'ACTIVE',
      employee_id: adminEmployee.id,
    },
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      id: generateULID(),
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });

  console.log('✅ Created admin user and employee');

  // Create super admin user
  const superAdminHashedPassword = await bcrypt.hash('superadmin123', 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@hrsystem.com' },
    update: {},
    create: {
      id: generateULID(),
      organization_id: systemOrg!.id,
      email: 'superadmin@hrsystem.com',
      password_hash: superAdminHashedPassword,
      status: 'ACTIVE',
    },
  });

  // Assign super admin role
  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: superAdminUser.id,
        role_id: superAdminRole.id,
      },
    },
    update: {},
    create: {
      id: generateULID(),
      user_id: superAdminUser.id,
      role_id: superAdminRole.id,
    },
  });

  // Create system department and job title for super admin
  const systemDept = await prisma.department.create({
    data: {
      id: generateULID(),
      organization_id: systemOrg!.id,
      name: 'System Administration',
      description: 'System administration department',
    },
  });

  const systemJobTitle = await prisma.jobTitle.create({
    data: {
      id: generateULID(),
      organization_id: systemOrg!.id,
      name: 'System Administrator',
      description: 'System administrator role',
    }
  });

  // Create super admin employee record
  let superAdminEmployee = await prisma.employee.findFirst({
    where: { email: 'superadmin@hrsystem.com', organization_id: systemOrg!.id }
  });

  if (!superAdminEmployee) {
    superAdminEmployee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organization_id: systemOrg!.id,
        department_id: systemDept.id,
        job_title_id: systemJobTitle.id,
        custom_id: 'SYS-001',
        first_name: 'Super',
        last_name: 'Admin',
        email: 'superadmin@hrsystem.com',
        work_email: 'superadmin@hrsystem.com',
        work_contact: '+1-555-0000',
        personal_address: 'System Administration',
        personal_contact_number: '+1-555-0000',
        personal_email: 'superadmin@hrsystem.com',
        date_of_birth: new Date('1980-01-01'),
        gender: 'Other',
        employment_status: 'ACTIVE',
        hire_date: new Date('2023-01-01'),
      },
    });
  }

  // Link super admin user to employee
  await prisma.user.update({
    where: { id: superAdminUser.id },
    data: { employee_id: superAdminEmployee.id },
  });

  console.log('✅ Created super admin user and employee');

  // Create sample employees
  const employees = await Promise.all([
    // Engineer
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'john.doe@techcorp.com', organization_id: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organization_id: organization.id,
            department_id: engineeringDept.id,
            job_title_id: seniorEngineer.id,
            manager_id: adminEmployee.id,
            custom_id: 'ENG-001',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@techcorp.com',
            work_email: 'john.doe.work@techcorp.com',
            work_contact: '+1-555-0123',
            personal_address: '123 Main Street, Springfield, IL 62701',
            personal_contact_number: '+1-555-0456',
            personal_email: 'john.doe.personal@gmail.com',
            date_of_birth: new Date('1990-05-15'),
            gender: 'Male',
            employment_status: 'ACTIVE',
            hire_date: new Date('2023-03-15'),
          },
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'john.doe@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organization_id: organization.id,
          email: 'john.doe@techcorp.com',
          password_hash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employee_id: employee.id,
        },
      });

      return { ...employee, userId: user.id };
    })(),
    // HR Staff
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'jane.smith@techcorp.com', organization_id: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organization_id: organization.id,
            department_id: hrDept.id,
            job_title_id: hrManager.id,
            manager_id: adminEmployee.id,
            custom_id: 'HR-001',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@techcorp.com',
            work_email: 'jane.smith.work@techcorp.com',
            work_contact: '+1-555-0124',
            personal_address: '456 Oak Avenue, Chicago, IL 60601',
            personal_contact_number: '+1-555-0457',
            personal_email: 'jane.smith.personal@gmail.com',
            date_of_birth: new Date('1988-09-22'),
            gender: 'Female',
            employment_status: 'ACTIVE',
            hire_date: new Date('2023-02-01'),
          },
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'jane.smith@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organization_id: organization.id,
          email: 'jane.smith@techcorp.com',
          password_hash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employee_id: employee.id,
        },
      });

      return { ...employee, userId: user.id };
    })(),
    // Sales Rep
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'mike.johnson@techcorp.com', organization_id: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organization_id: organization.id,
            department_id: salesDept.id,
            job_title_id: salesRep.id,
            manager_id: adminEmployee.id,
            custom_id: 'SALES-001',
            first_name: 'Mike',
            last_name: 'Johnson',
            email: 'mike.johnson@techcorp.com',
            work_email: 'mike.johnson.work@techcorp.com',
            work_contact: '+1-555-0125',
            personal_address: '789 Pine Road, Austin, TX 78701',
            personal_contact_number: '+1-555-0458',
            personal_email: 'mike.johnson.personal@gmail.com',
            date_of_birth: new Date('1992-12-08'),
            gender: 'Male',
            employment_status: 'ACTIVE',
            hire_date: new Date('2023-04-10'),
          },
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'mike.johnson@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organization_id: organization.id,
          email: 'mike.johnson@techcorp.com',
          password_hash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employee_id: employee.id,
        },
      });

      return { ...employee, userId: user.id };
    })(),
  ]);

  console.log('✅ Created sample employees');

  // Assign roles to sample employees
  await Promise.all(
    employees.map((employee, index) => {
      const roleId = index === 1 ? hrRole.id : employeeRole.id;
      return prisma.userRole.upsert({
        where: {
          user_id_role_id: {
            user_id: employee.userId,
            role_id: roleId,
          },
        },
        update: {},
        create: {
          id: generateULID(),
          user_id: employee.userId,
          role_id: roleId,
        },
      });
    })
  );

  // Create sample leave requests
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
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
      id: generateULID(),
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
          id: generateULID(),
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
  console.log('Super Admin: superadmin@hrsystem.com / superadmin123');
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
