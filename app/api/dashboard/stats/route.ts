import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEmployeeService, getDepartmentService, getPayrollService, getLeaveRequestService } from '@/lib/service';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const employeeService = getEmployeeService();
    const departmentService = getDepartmentService();
    const payrollService = getPayrollService();
    const leaveRequestService = getLeaveRequestService();

    const [
      allEmployees,
      allDepartments,
      allPayrolls,
      allLeaveRequests
    ] = await Promise.all([
      employeeService.getAll(),
      departmentService.getAll(session, {}),
      payrollService.getAll(),
      leaveRequestService.getAll()
    ]);

    const totalEmployees = allEmployees.data.filter(e => e.employmentStatus === 'ACTIVE').length;
    const totalDepartments = allDepartments.data.length;
    const totalPayroll = allPayrolls.data.reduce((sum, p) => sum + p.netPay, 0);
    const pendingLeaveRequests = allLeaveRequests.data.filter(lr => lr.status === 'PENDING').length;

    const stats = {
      totalEmployees,
      totalDepartments,
      totalPayroll,
      pendingLeaveRequests
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
