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

    const { organization_id, first_name, last_name, work_email, work_contact } = await request.json();

    if (!organization_id || !first_name || !last_name || !work_email || !work_contact) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const organization = await organizationService.getById(organization_id);

    if (!organization || organization.name === 'System') {
      return NextResponse.json({ message: 'Invalid organization' }, { status: 400 });
    }

    const existingUser = await userService.getByEmail(work_email);

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    const adminRole = (await roleService.getByOrganizationId(organization.id)).find(r => r.name === 'ADMIN');

    if (!adminRole) {
      return NextResponse.json({ message: 'Admin role not found for organization' }, { status: 500 });
    }

    const departments = await departmentService.getByOrganizationId(organization.id);
    let hrDept = departments.find(d => d.name === 'Human Resources');

    if (!hrDept) {
      hrDept = await departmentService.create({
        organization_id: organization.id,
        name: 'Human Resources',
        description: 'HR and people operations',
      });
    }

    const jobTitles = await jobTitleService.getByOrganizationId(organization.id);
    let hrJobTitle = jobTitles.find(jt => jt.name === 'HR Manager');

    if (!hrJobTitle) {
      hrJobTitle = await jobTitleService.create({
        organization_id: organization.id,
        name: 'HR Manager',
        description: 'Human resources manager',
      });
    }

    const hashedPassword = await userService.hashPassword('admin123');
    const newUser = await userService.create({
      organization_id: organization.id,
      email: work_email,
      password_hash: hashedPassword,
      status: 'ACTIVE',
      name: `${first_name} ${last_name}`,
      emailVerified: null,
      image: null,
    });

    await userRoleService.create({
      user_id: newUser.id,
      role_id: adminRole.id,
    });

    const employee = await employeeService.create({
      organization_id: organization.id,
      user_id: newUser.id,
      department_id: hrDept.id,
      job_title_id: hrJobTitle.id,
      manager_id: null,
      first_name,
      last_name,
      email: work_email,
      work_email,
      work_contact,
      personal_address: 'To be updated',
      personal_contact_number: work_contact,
      personal_email: work_email,
      date_of_birth: new Date('1985-01-01'),
      gender: 'Other',
      employment_status: 'ACTIVE',
      hire_date: new Date(),
      exit_date: null,
    });

    return NextResponse.json({
      message: 'Admin onboarded successfully',
      user: { id: newUser.id, email: newUser.email },
      employee: { id: employee.id, name: `${first_name} ${last_name}` }
    });

  } catch (error) {
    console.error('Error onboarding admin:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
