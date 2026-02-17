import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserService, getRoleService, getOrganizationService, getDepartmentService, getJobTitleService, getEmployeeService, getUserRoleService } from '@/lib/service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userService = getUserService();
    const roleService = getRoleService();
    const organizationService = getOrganizationService();
    const departmentService = getDepartmentService();
    const jobTitleService = getJobTitleService();
    const employeeService = getEmployeeService();
    const userRoleService = getUserRoleService();

    const user = await userService.getById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const superAdminRole = await roleService.getByName('SUPER_ADMIN');
    if (!superAdminRole) {
      return NextResponse.json({ message: 'Access denied. Super admin required.' }, { status: 403 });
    }

    const { organizationId, firstName, lastName, email, work_contact } = await request.json();

    if (!organizationId || !firstName || !lastName || !email || !work_contact) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const organization = await organizationService.getById(organizationId);

    if (!organization || organization.name === 'System') {
      return NextResponse.json({ message: 'Invalid organization' }, { status: 400 });
    }

    const existingUser = await userService.getByEmail(email);

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    const adminRole = (await roleService.getByOrganizationId(organization.id)).find(r => r.name === 'ADMIN');

    if (!adminRole) {
      return NextResponse.json({ message: 'Admin role not found for organization' }, { status: 500 });
    }

    const departments = await departmentService.getByOrganizationId(session, organization.id);
    let hrDept = departments.find(d => d.name === 'Human Resources');

    if (!hrDept) {
      hrDept = await departmentService.create(session, {
        organizationId: organization.id,
        name: 'Human Resources',
        description: 'HR and people operations',
      });
    }

    const jobTitles = await jobTitleService.getByOrganizationId(organization.id);
    let hrJobTitle = jobTitles.find(jt => jt.name === 'HR Manager');

    if (!hrJobTitle) {
      hrJobTitle = await jobTitleService.create({
        organizationId: organization.id,
        name: 'HR Manager',
        description: 'Human resources manager',
      });
    }

    const hashedPassword = await userService.hashPassword('admin123');
    const newUser = await userService.create({
      email: email,
      organizationId: organization.id,
      employeeId: '', // Temporary, will update after creating employee
      roleIds: [adminRole.id],
      status: 'ACTIVE',
      generatedPassword: 'admin123',
    });

    const employee = await employeeService.create({
      organizationId: organization.id,
      userId: newUser.id,
      departmentId: hrDept.id,
      jobTitleId: hrJobTitle.id,
      managerId: null,
      email,
      firstName,
      lastName,
      work_contact,
      personalAddress: 'To be updated',
      personalContactNumber: work_contact,
      dateOfBirth: new Date('1985-01-01'),
      gender: 'Other',
      employmentStatus: 'ACTIVE',
      hireDate: new Date(),
      exitDate: null,
    });

    // Update user with employee_id
    await userService.update(newUser.id, {
      employeeId: employee.id,
    });

    return NextResponse.json({
      message: 'Admin onboarded successfully',
      user: { id: newUser.id, email: newUser.email },
      employee: { id: employee.id, name: `${firstName} ${lastName}` }
    });

  } catch (error) {
    console.error('Error onboarding admin:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
