import { userController } from './controllers/user.controller';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestUser {
  email: string;
  password: string;
  role: string;
  expected: boolean;
}

const testUsers: TestUser[] = [
  {
    email: 'admin@techcorp.com',
    password: 'admin123',
    role: 'System Admin',
    expected: true
  },
  {
    email: 'jane.smith@techcorp.com',
    password: 'password123',
    role: 'HR Manager',
    expected: true
  },
  {
    email: 'john.doe@techcorp.com',
    password: 'password123',
    role: 'Senior Engineer',
    expected: true
  },
  {
    email: 'mike.johnson@techcorp.com',
    password: 'password123',
    role: 'Sales Rep',
    expected: true
  },
  {
    email: 'admin@techcorp.com',
    password: 'wrongpassword',
    role: 'System Admin (Wrong Password)',
    expected: false
  },
  {
    email: 'nonexistent@techcorp.com',
    password: 'password123',
    role: 'Non-existent User',
    expected: false
  }
];

async function validateTestLogins() {
  console.log('🔐 Validating Test Login Credentials');
  console.log('=====================================\n');

  // First check database connection
  console.log('📊 Checking database connection...');
  try {
    const { prisma } = await import('./db');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if users exist
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('💡 Please run: npm run db:seed');
    return;
  }

  console.log('\n🧪 Testing Login Credentials\n');

  let passedTests = 0;
  let totalTests = testUsers.length;

  for (const testUser of testUsers) {
    try {
      console.log(`🔍 Testing: ${testUser.role}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Expected: ${testUser.expected ? 'SUCCESS' : 'FAILURE'}`);

      const result = await userController.verifyPassword(testUser.email, testUser.password);
      const passed = (result !== null) === testUser.expected;

      if (passed) {
        console.log(`   ✅ ${result ? 'LOGIN SUCCESS' : 'LOGIN FAILED'} - Correct behavior`);
        passedTests++;
      } else {
        console.log(`   ❌ ${result ? 'LOGIN SUCCESS' : 'LOGIN FAILED'} - Unexpected result`);
      }

      // If login succeeded, get user details
      if (result && testUser.expected) {
        try {
          const { prisma } = await import('./db');
          const user = await prisma.user.findUnique({
            where: { email: testUser.email },
            include: {
              userRoles: {
                include: { role: true }
              },
              employee: {
                include: {
                  department: true,
                  jobTitle: true
                }
              }
            }
          });
          
          if (user) {
            console.log(`   👤 User ID: ${user.id}`);
            console.log(`   🎭 Role: ${user.userRoles[0]?.role?.name || 'No role'}`);
            console.log(`   📧 Status: ${user.status}`);
            if (user.employee) {
              console.log(`   🏢 Department: ${user.employee.department?.name || 'None'}`);
              console.log(`   💼 Job Title: ${user.employee.jobTitle?.name || 'None'}`);
            }
          }
          await prisma.$disconnect();
        } catch (error) {
          console.log(`   ⚠️ Could not fetch user details: ${error}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
    }

    console.log('');
  }

  // Summary
  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All login tests passed successfully!');
    console.log('\n🚀 Ready to start the application:');
    console.log('   npm run dev');
    console.log('\n🔑 Login credentials are working correctly');
  } else {
    console.log('\n⚠️ Some login tests failed');
    console.log('💡 Possible solutions:');
    console.log('   1. Run npm run db:seed to ensure users exist');
    console.log('   2. Check database connection: npx tsx lib/validate-db.ts');
    console.log('   3. Verify user passwords in database');
  }

  console.log('\n📱 Quick Login Reference:');
  console.log('========================');
  testUsers.filter(u => u.expected).forEach(user => {
    console.log(`🔑 ${user.role}: ${user.email} / ${user.password}`);
  });
}

// Additional validation for user roles and permissions
async function validateUserRoles() {
  console.log('\n🎭 Validating User Roles and Permissions');
  console.log('======================================\n');

  try {
    const { prisma } = await import('./db');
    await prisma.$connect();

    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        employee: {
          include: {
            department: true,
            jobTitle: true
          }
        }
      }
    });

    for (const user of users) {
      const role = user.userRoles[0]?.role;
      console.log(`👤 ${user.email}`);
      console.log(`   🎭 Role: ${role?.name || 'No role assigned'}`);
      console.log(`   📧 Status: ${user.status}`);
      
      if (user.employee) {
        console.log(`   🏢 Department: ${user.employee.department?.name || 'None'}`);
        console.log(`   💼 Job Title: ${user.employee.jobTitle?.name || 'None'}`);
      }

      if (role?.rolePermissions) {
        const permissions = role.rolePermissions.map(rp => rp.permission.name);
        console.log(`   🔐 Permissions: ${permissions.length} permissions`);
        console.log(`      ${permissions.slice(0, 3).join(', ')}${permissions.length > 3 ? '...' : ''}`);
      }

      console.log('');
    }

    await prisma.$disconnect();
    console.log('✅ User roles validation completed');
  } catch (error) {
    console.error('❌ User roles validation failed:', error);
  }
}

// Main execution
if (require.main === module) {
  validateTestLogins()
    .then(() => {
      return validateUserRoles();
    })
    .then(() => {
      console.log('\n🎉 All validations completed successfully!');
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateTestLogins, validateUserRoles };
