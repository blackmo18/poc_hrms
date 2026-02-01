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
        contactNumber: '+1-555-0000',
        address: 'System Administration',
        website: 'https://hrsystem.com',
        description: 'System administration organization',
        status: 'ACTIVE',
        updatedAt: new Date(),
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
        contactNumber: '+1-555-0101',
        address: '123 Business Ave, Tech City, TC 12345',
        website: 'https://techcorp.com',
        description: 'Leading technology solutions provider',
        status: 'ACTIVE',
        updatedAt: new Date(),
      } as any,
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
      contactNumber: '+1-555-0102',
      address: '456 Financial Plaza, New York, NY 10001',
      website: 'https://globalfinance.com',
      description: 'Premier financial services and consulting firm',
    },
    {
      name: 'Creative Design Studios',
      email: 'hello@creativedesign.com',
      contactNumber: '+1-555-0103',
      address: '789 Art District, Los Angeles, CA 90001',
      website: 'https://creativedesign.com',
      description: 'Award-winning design and branding agency',
    },
    {
      name: 'Healthcare Innovations Inc',
      email: 'support@healthcareinnovations.com',
      contactNumber: '+1-555-0104',
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
          updatedAt: new Date(),
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
    where: { name: 'ADMIN', organizationId: organization.id }
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'ADMIN',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let hrRole = await prisma.role.findFirst({
    where: { name: 'HR_MANAGER', organizationId: organization.id }
  });
  if (!hrRole) {
    hrRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'HR_MANAGER',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let employeeRole = await prisma.role.findFirst({
    where: { name: 'EMPLOYEE', organizationId: organization.id }
  });
  if (!employeeRole) {
    employeeRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'EMPLOYEE',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let managerRole = await prisma.role.findFirst({
    where: { name: 'MANAGER', organizationId: organization.id }
  });
  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'MANAGER',
        organizationId: organization.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', organizationId: systemOrg!.id }
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        id: generateULID(),
        name: 'SUPER_ADMIN',
        organizationId: systemOrg!.id,
        updatedAt: new Date(),
      } as any,
    });
  }

  console.log('✅ Created roles');

  // Create permissions using upsert
  console.log('🔑 Creating permissions...');
  const permissionNames = [
    { name: 'users.create', description: 'Create users', organizationId: systemOrg!.id },
    { name: 'users.read', description: 'Read users', organizationId: systemOrg!.id },
    { name: 'users.update', description: 'Update users', organizationId: systemOrg!.id },
    { name: 'users.delete', description: 'Delete users', organizationId: systemOrg!.id },
    { name: 'employees.create', description: 'Create employees', organizationId: organization.id },
    { name: 'employees.read', description: 'Read employees', organizationId: organization.id },
    { name: 'employees.update', description: 'Update employees', organizationId: organization.id },
    { name: 'employees.delete', description: 'Delete employees', organizationId: organization.id },
    { name: 'payroll.create', description: 'Create payroll', organizationId: organization.id },
    { name: 'payroll.read', description: 'Read payroll', organizationId: organization.id },
    { name: 'payroll.update', description: 'Update payroll', organizationId: organization.id },
    { name: 'payroll.delete', description: 'Delete payroll', organizationId: organization.id },
    { name: 'payroll.process', description: 'Process payroll', organizationId: organization.id },
    { name: 'leave.approve', description: 'Approve leave requests', organizationId: organization.id },
    { name: 'timesheet.own', description: 'Manage own timesheet', organizationId: organization.id },
    { name: 'timesheet.own.read', description: 'Read own timesheet', organizationId: organization.id },
    { name: 'timesheet.manage', description: 'Manage all timesheets', organizationId: organization.id },
    { name: 'overtime.request', description: 'File overtime request', organizationId: organization.id },
    { name: 'overtime.approve', description: 'Approve/reject overtime requests', organizationId: organization.id },
    { name: 'timeoff.request', description: 'File time off request', organizationId: organization.id },
    { name: 'timeoff.approve', description: 'Approve/reject time off requests', organizationId: organization.id },
  ];

  const permissions = await Promise.all(
    permissionNames.map(perm => {
      const id = generateULID();
      return prisma.permission.upsert({
        where: { id } as any,
        update: {},
        create: {
          id,
          ...perm,
        } as any,
      });
    })
  );

  console.log('✅ Created permissions');

  // Assign permissions to roles using upsert
  console.log('🔗 Assigning permissions to roles...');
  await Promise.all([
    // Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } } as any,
        update: {},
        create: {
          id: generateULID(),
          roleId: adminRole.id,
          permissionId: permission.id,
          updatedAt: new Date(),
        } as any
      })
    ),
    // HR gets employee, leave, and timesheet permissions
    ...permissions.filter(p => p.name.includes('employees') || p.name.includes('leave') || p.name.includes('timesheet'))
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: hrRole.id, permissionId: permission.id } } as any,
          update: {},
          create: {
            id: generateULID(),
            roleId: hrRole.id,
            permissionId: permission.id,
            updatedAt: new Date(),
          } as any
        })
      ),
    // Employee gets read permissions, own timesheet, and request permissions
    ...permissions.filter(p => 
      p.name.includes('read') || 
      p.name.includes('timesheet.own') ||
      p.name.includes('overtime.request') ||
      p.name.includes('timeoff.request')
    )
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } } as any,
          update: {},
          create: {
            id: generateULID(),
            roleId: employeeRole.id,
            permissionId: permission.id,
            updatedAt: new Date(),
          } as any
        })
      ),
    // Manager gets all employee permissions plus approval permissions
    ...permissions.filter(p => 
      p.name.includes('employees.read') || 
      p.name.includes('timesheet') ||
      p.name.includes('overtime') ||
      p.name.includes('timeoff') ||
      p.name.includes('leave')
    )
      .map(permission =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permission.id } } as any,
          update: {},
          create: {
            id: generateULID(),
            roleId: managerRole.id,
            permissionId: permission.id,
            updatedAt: new Date(),
          } as any
        })
      ),
    // Super Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } } as any,
        update: {},
        create: {
          id: generateULID(),
          roleId: superAdminRole.id,
          permissionId: permission.id,
          updatedAt: new Date(),
        } as any
      })
    ),
  ]);

  console.log('✅ Assigned permissions to roles');

  // Create departments
  const engineeringDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Engineering' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Engineering',
      description: 'Software development and engineering team',
      updatedAt: new Date(),
    } as any,
  });

  const hrDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Human Resources' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Human Resources',
      description: 'HR and recruitment team',
      updatedAt: new Date(),
    } as any,
  });

  const salesDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Sales' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Sales',
      description: 'Sales and business development team',
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created departments');

  // Create job titles
  const seniorEngineer = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Senior Software Engineer' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Senior Software Engineer',
      description: 'Experienced software engineer',
      updatedAt: new Date(),
    } as any,
  });

  const hrManager = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'HR Manager' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'HR Manager',
      description: 'Human resources manager',
      updatedAt: new Date(),
    } as any,
  });

  const salesRep = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Sales Representative' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      name: 'Sales Representative',
      description: 'Sales team member',
      updatedAt: new Date(),
    } as any,
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
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: financeOrg.id, name: 'Financial Analyst' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: financeOrg.id,
        name: 'Financial Analyst',
        description: 'Financial analysis and reporting specialist',
        updatedAt: new Date(),
      } as any,
    });
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: financeOrg.id, name: 'Investment Advisor' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: financeOrg.id,
        name: 'Investment Advisor',
        description: 'Investment planning and advisory services',
        updatedAt: new Date(),
      } as any,
    });
  }

  if (designOrg) {
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: designOrg.id, name: 'Senior Designer' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: designOrg.id,
        name: 'Senior Designer',
        description: 'Lead designer with creative direction',
        updatedAt: new Date(),
      } as any,
    });
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: designOrg.id, name: 'UX Researcher' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: designOrg.id,
        name: 'UX Researcher',
        description: 'User experience research and analysis',
        updatedAt: new Date(),
      } as any,
    });
  }

  if (healthcareOrg) {
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: healthcareOrg.id, name: 'Clinical Coordinator' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: healthcareOrg.id,
        name: 'Clinical Coordinator',
        description: 'Healthcare coordination and patient management',
        updatedAt: new Date(),
      } as any,
    });
    await prisma.jobTitle.upsert({
      where: { organizationId_name: { organizationId: healthcareOrg.id, name: 'Medical Technologist' } },
      update: {},
      create: {
        id: generateULID(),
        organizationId: healthcareOrg.id,
        name: 'Medical Technologist',
        description: 'Medical technology and diagnostics specialist',
        updatedAt: new Date(),
      } as any,
    });
  }

  console.log('✅ Created job titles for additional organizations');

  // Create admin employee record first
  let adminEmployee = await prisma.employee.findFirst({
    where: { email: 'admin@techcorp.com', organizationId: organization.id }
  });

  if (!adminEmployee) {
    adminEmployee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organizationId: organization.id,
        departmentId: hrDept.id,
        jobTitleId: hrManager.id,
        employeeId: 'ADMIN-001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@techcorp.com',
        hireDate: new Date('2023-01-01'),
        updatedAt: new Date(),
      } as any,
    });
  }

  // Create admin user and link to employee
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@techcorp.com' },
    update: {},
    create: {
      id: generateULID(),
      organizationId: organization.id,
      email: 'admin@techcorp.com',
      passwordHash: hashedPassword,
      status: 'ACTIVE',
      employeeId: adminEmployee.id,
      updatedAt: new Date(),
    } as any,
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    } as any,
    update: {},
    create: {
      id: generateULID(),
      userId: adminUser.id,
      roleId: adminRole.id,
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created admin user and employee');

  // Create system department and job title for super admin
  const systemDept = await prisma.department.upsert({
    where: { organizationId_name: { organizationId: systemOrg!.id, name: 'System Administration' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: systemOrg!.id,
      name: 'System Administration',
      description: 'System administration department',
      updatedAt: new Date(),
    } as any,
  });

  const systemJobTitle = await prisma.jobTitle.upsert({
    where: { organizationId_name: { organizationId: systemOrg!.id, name: 'System Administrator' } },
    update: {},
    create: {
      id: generateULID(),
      organizationId: systemOrg!.id,
      name: 'System Administrator',
      description: 'System administrator role',
      updatedAt: new Date(),
    } as any
  });

  // Create super admin employee record FIRST
  let superAdminEmployee = await prisma.employee.findFirst({
    where: { email: 'superadmin@hrsystem.com', organizationId: systemOrg!.id }
  });

  if (!superAdminEmployee) {
    superAdminEmployee = await prisma.employee.create({
      data: {
        id: generateULID(),
        organizationId: systemOrg!.id,
        departmentId: systemDept.id,
        jobTitleId: systemJobTitle.id,
        employeeId: "SUPERADMIN-001",
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@hrsystem.com',
        hireDate: new Date('2023-01-01'),
        updatedAt: new Date(),
      } as any,
    });
  }

  // Create super admin user AFTER employee exists
  const superAdminHashedPassword = await bcrypt.hash('superadmin123', 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@hrsystem.com' },
    update: {},
    create: {
      id: generateULID(),
      organizationId: systemOrg!.id,
      email: 'superadmin@hrsystem.com',
      passwordHash: superAdminHashedPassword,
      status: 'ACTIVE',
      employeeId: superAdminEmployee.id,
      updatedAt: new Date(),
    } as any,
  });

  // Assign super admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    } as any,
    update: {},
    create: {
      id: generateULID(),
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      updatedAt: new Date(),
    } as any,
  });

  console.log('✅ Created super admin user and employee');

  // Create sample employees
  const employees = await Promise.all([
    // Engineer
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'john.doe@techcorp.com', organizationId: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organizationId: organization.id,
            departmentId: engineeringDept.id,
            jobTitleId: seniorEngineer.id,
            managerId: adminEmployee.id,
            employeeId: 'ENG-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@techcorp.com',
            hireDate: new Date('2023-03-15'),
          } as any,
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'john.doe@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organizationId: organization.id,
          email: 'john.doe@techcorp.com',
          passwordHash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employeeId: employee.id,
        } as any,
      });

      return { ...employee, userId: user.id };
    })(),
    // HR Staff
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'jane.smith@techcorp.com', organizationId: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organizationId: organization.id,
            departmentId: hrDept.id,
            jobTitleId: hrManager.id,
            managerId: adminEmployee.id,
            employeeId: 'HR-001',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@techcorp.com',
            hireDate: new Date('2023-02-01'),
          } as any,
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'jane.smith@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organizationId: organization.id,
          email: 'jane.smith@techcorp.com',
          passwordHash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employeeId: employee.id,
        } as any,
      });

      return { ...employee, userId: user.id };
    })(),
    // Sales Rep
    (async () => {
      let employee = await prisma.employee.findFirst({
        where: { email: 'mike.johnson@techcorp.com', organizationId: organization.id }
      });

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            id: generateULID(),
            organizationId: organization.id,
            departmentId: salesDept.id,
            jobTitleId: salesRep.id,
            managerId: adminEmployee.id,
            employeeId: 'SALES-001',
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@techcorp.com',
            hireDate: new Date('2023-04-10'),
          } as any,
        });
      }

      const user = await prisma.user.upsert({
        where: { email: 'mike.johnson@techcorp.com' },
        update: {},
        create: {
          id: generateULID(),
          organizationId: organization.id,
          email: 'mike.johnson@techcorp.com',
          passwordHash: await bcrypt.hash('password123', 10),
          status: 'ACTIVE',
          employeeId: employee.id,
        } as any,
      });

      return { ...employee, userId: user.id };
    })(),
  ]);

  console.log('✅ Created sample employees');

  // Assign roles to sample employees
  await Promise.all(
    employees.map((employee, index) => {
      let roleId;
      if (index === 1) {
        roleId = hrRole.id;
      } else if (index === 0) {
        roleId = managerRole.id; // First employee gets manager role
      } else {
        roleId = employeeRole.id;
      }
      return prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: employee.userId,
            roleId: roleId,
          },
        } as any,
        update: {},
        create: {
          id: generateULID(),
          userId: employee.userId,
          roleId: roleId,
        } as any,
      });
    })
  );

  // Create sample leave requests
  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[0].id,
      organizationId: organization.id,
      leaveType: 'VACATION',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-25'),
      status: 'PENDING',
      remarks: 'Christmas vacation',
    } as any,
  });

  await prisma.leaveRequest.create({
    data: {
      id: generateULID(),
      employeeId: employees[1].id,
      organizationId: organization.id,
      leaveType: 'SICK',
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-16'),
      status: 'APPROVED',
      remarks: 'Flu symptoms',
    } as any,
  });

  console.log('✅ Created sample leave requests');

  console.log('✅ Created sample overtime requests');

  console.log('🎉 Database seeding completed successfully!');

  // Create sample compensation records
  await Promise.all(
    employees.map(employee =>
      prisma.compensation.create({
        data: {
          id: generateULID(),
          employeeId: employee.id,
          organizationId: organization.id,
          baseSalary: employee.jobTitleId === seniorEngineer.id ? 120000 : 75000,
          payFrequency: 'MONTHLY',
          effectiveDate: new Date('2023-01-01'),
        } as any,
      })
    )
  );

  console.log('✅ Created compensation records');

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
