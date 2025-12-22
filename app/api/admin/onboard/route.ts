import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has SUPER_ADMIN role
    const userRoles = await prisma.userRole.findMany({
      where: { user_id: parseInt(session.user.id) },
      include: { role: true }
    });

    const isSuperAdmin = userRoles.some(userRole => userRole.role.name === 'SUPER_ADMIN');

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const { organization_id, first_name, last_name, work_email, work_contact } = await request.json();

    if (!organization_id || !first_name || !last_name || !work_email || !work_contact) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Check if organization exists and is not system
    const organization = await prisma.organization.findUnique({
      where: { id: parseInt(organization_id) }
    });

    if (!organization || organization.name === 'System') {
      return NextResponse.json({ message: 'Invalid organization' }, { status: 400 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: work_email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    // Get ADMIN role for the organization
    const adminRole = await prisma.role.findFirst({
      where: {
        name: 'ADMIN',
        organization_id: organization.id
      }
    });

    if (!adminRole) {
      return NextResponse.json({ message: 'Admin role not found for organization' }, { status: 500 });
    }

    // Create departments if not exist (HR, Engineering, Sales)
    let hrDept = await prisma.department.findFirst({
      where: {
        organization_id: organization.id,
        name: 'Human Resources'
      }
    });

    if (!hrDept) {
      hrDept = await prisma.department.create({
        data: {
          organization_id: organization.id,
          name: 'Human Resources',
          description: 'HR and people operations',
        }
      });
    }

    let hrJobTitle = await prisma.jobTitle.findFirst({
      where: {
        organization_id: organization.id,
        name: 'HR Manager'
      }
    });

    if (!hrJobTitle) {
      hrJobTitle = await prisma.jobTitle.create({
        data: {
          organization_id: organization.id,
          name: 'HR Manager',
          description: 'Human resources manager',
        }
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash('admin123', 10); // Default password
    const user = await prisma.user.create({
      data: {
        organization_id: organization.id,
        email: work_email,
        password_hash: hashedPassword,
        status: 'ACTIVE',
      }
    });

    // Assign admin role
    await prisma.userRole.create({
      data: {
        user_id: user.id,
        role_id: adminRole.id,
      }
    });

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        organization_id: organization.id,
        user_id: user.id,
        department_id: hrDept.id,
        job_title_id: hrJobTitle.id,
        first_name,
        last_name,
        email: work_email,
        work_email,
        work_contact,
        personal_address: 'To be updated',
        personal_contact_number: work_contact,
        personal_email: work_email,
        date_of_birth: new Date('1985-01-01'), // Default
        gender: 'Other',
        employment_status: 'ACTIVE',
        hire_date: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Admin onboarded successfully',
      user: { id: user.id, email: user.email },
      employee: { id: employee.id, name: `${first_name} ${last_name}` }
    });

  } catch (error) {
    console.error('Error onboarding admin:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
