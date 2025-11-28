import { prisma } from './db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixHRRole() {
  console.log('🔧 Fixing HR Manager Role Assignment');
  console.log('===================================\n');

  try {
    await prisma.$connect();

    // Find HR Manager role
    const hrRole = await prisma.role.findUnique({
      where: { name: 'HR_MANAGER' }
    });

    if (!hrRole) {
      console.log('❌ HR_MANAGER role not found');
      return;
    }

    console.log('✅ Found HR_MANAGER role:', hrRole.name);

    // Find Jane Smith (HR Manager user)
    const janeUser = await prisma.user.findUnique({
      where: { email: 'jane.smith@techcorp.com' },
      include: {
        userRoles: true
      }
    });

    if (!janeUser) {
      console.log('❌ Jane Smith user not found');
      return;
    }

    console.log('✅ Found Jane Smith user');

    // Remove existing role assignments
    await prisma.userRole.deleteMany({
      where: { user_id: janeUser.id }
    });

    // Assign HR Manager role
    await prisma.userRole.create({
      data: {
        user_id: janeUser.id,
        role_id: hrRole.id
      }
    });

    console.log('✅ Assigned HR_MANAGER role to Jane Smith');

    // Verify the assignment
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'jane.smith@techcorp.com' },
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
        }
      }
    });

    if (updatedUser) {
      const role = updatedUser.userRoles[0]?.role;
      console.log('\n📊 Updated User Details:');
      console.log(`   👤 Email: ${updatedUser.email}`);
      console.log(`   🎭 Role: ${role?.name}`);
      console.log(`   📧 Status: ${updatedUser.status}`);
      
      if (role?.rolePermissions) {
        const permissions = role.rolePermissions.map(rp => rp.permission.name);
        console.log(`   🔐 Permissions (${permissions.length}):`);
        permissions.forEach(perm => console.log(`      - ${perm}`));
      }
    }

    await prisma.$disconnect();
    console.log('\n🎉 HR Manager role assignment fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing HR role:', error);
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixHRRole();
}

export { fixHRRole };
