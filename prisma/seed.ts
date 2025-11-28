import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Tech Corp Inc.',
      address: '123 Business Ave, Tech City, TC 12345',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created organization:', organization.name);

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'System administrator with full access',
      organization_id: organization.id,
    },
  });

  const hrRole = await prisma.role.create({
    data: {
      name: 'HR_MANAGER',
      description: 'Human Resources manager with employee management access',
      organization_id: organization.id,
    },
  });

  const employeeRole = await prisma.role.create({
    data: {
      name: 'EMPLOYEE',
      description: 'Regular employee with self-service access',
      organization_id: organization.id,
    },
  });

  console.log('✅ Created roles');

  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.create({ data: { name: 'users.create', description: 'Create users' } }),
    prisma.permission.create({ data: { name: 'users.read', description: 'Read users' } }),
    prisma.permission.create({ data: { name: 'users.update', description: 'Update users' } }),
    prisma.permission.create({ data: { name: 'users.delete', description: 'Delete users' } }),
    prisma.permission.create({ data: { name: 'employees.create', description: 'Create employees' } }),
    prisma.permission.create({ data: { name: 'employees.read', description: 'Read employees' } }),
    prisma.permission.create({ data: { name: 'employees.update', description: 'Update employees' } }),
    prisma.permission.create({ data: { name: 'employees.delete', description: 'Delete employees' } }),
    prisma.permission.create({ data: { name: 'payroll.process', description: 'Process payroll' } }),
    prisma.permission.create({ data: { name: 'leave.approve', description: 'Approve leave requests' } }),
  ]);

  console.log('✅ Created permissions');

  // Assign permissions to roles
  await Promise.all([
    // Admin gets all permissions
    ...permissions.map(permission =>
      prisma.rolePermission.create({
        data: { role_id: adminRole.id, permission_id: permission.id }
      })
    ),
    // HR gets employee and leave permissions
    ...permissions.filter(p => p.name.includes('employees') || p.name.includes('leave'))
      .map(permission =>
        prisma.rolePermission.create({
          data: { role_id: hrRole.id, permission_id: permission.id }
        })
      ),
    // Employee gets read permissions only
    ...permissions.filter(p => p.name.includes('read'))
      .map(permission =>
        prisma.rolePermission.create({
          data: { role_id: employeeRole.id, permission_id: permission.id }
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

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
