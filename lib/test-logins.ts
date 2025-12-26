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
  },
  {
    email: 'superadmin@hrsystem.com',
    password: 'superadmin123',
    role: 'Super Admin',
    expected: true
  }
];

async function testLogins() {
  console.log('🔐 Testing Login Credentials');
  console.log('============================\n');

  let passedTests = 0;
  let totalTests = testUsers.length;

  for (const testUser of testUsers) {
    try {
      console.log(`🔍 Testing: ${testUser.role}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Expected: ${testUser.expected ? 'SUCCESS' : 'FAILURE'}`);

      const result = await userController.verifyPassword(testUser.email, testUser.password);
      
      // Check if result matches expectation (result is User object or null)
      const testPassed = (result !== null) === testUser.expected;
      
      if (testPassed) {
        console.log(`   ✅ TEST PASSED: ${result ? 'LOGIN SUCCESS' : 'LOGIN FAILED'}`);
        passedTests++;
      } else {
        console.log(`   ❌ TEST FAILED: Expected ${testUser.expected ? 'SUCCESS' : 'FAILURE'}, got ${result ? 'SUCCESS' : 'FAILURE'}`);
      }

      // If login succeeded and expected to succeed, show user details
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
      // If we expect failure and got an error, that's actually correct
      if (!testUser.expected) {
        console.log(`   ✅ TEST PASSED: Expected failure and got error`);
        passedTests++;
      }
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
    console.log('\n🚀 Application is ready for testing:');
    console.log('   npm run dev');
    console.log('\n🔑 Login credentials are working correctly');
  } else {
    console.log('\n⚠️ Some login tests failed');
    console.log('💡 Check the individual test results above');
  }

  console.log('\n📱 Login Credentials Reference:');
  console.log('===============================');
  testUsers.filter(u => u.expected).forEach(user => {
    console.log(`🔑 ${user.role}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log('');
  });
}

// Test API endpoints as well
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints');
  console.log('========================\n');

  try {
    // Test organizations endpoint
    const orgResponse = await fetch('http://localhost:3000/api/organizations');
    console.log(`📊 Organizations API: ${orgResponse.ok ? '✅ Working' : '❌ Failed'}`);

    // Test employees endpoint
    const empResponse = await fetch('http://localhost:3000/api/employees');
    console.log(`👥 Employees API: ${empResponse.ok ? '✅ Working' : '❌ Failed'}`);

    // Test dashboard stats endpoint
    const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats');
    console.log(`📈 Dashboard Stats API: ${statsResponse.ok ? '✅ Working' : '❌ Failed'}`);

  } catch (error) {
    console.log('❌ API tests failed - make sure development server is running');
    console.log('💡 Start with: npm run dev');
  }
}

// Main execution
if (require.main === module) {
  testLogins()
    .then(() => {
      return testAPIEndpoints();
    })
    .then(() => {
      console.log('\n🎉 Login validation completed!');
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { testLogins, testAPIEndpoints };
