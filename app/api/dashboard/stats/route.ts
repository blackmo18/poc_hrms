import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeService, getDepartmentService, getPayrollService, getLeaveRequestService } from '@/lib/service';

export async function GET(request: NextRequest) {
  try {
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
      departmentService.getAll(),
      payrollService.getAll(),
      leaveRequestService.getAll()
    ]);

    const totalEmployees = allEmployees.data.filter(e => e.employment_status === 'ACTIVE').length;
    const totalDepartments = allDepartments.data.length;
    const totalPayroll = allPayrolls.data.reduce((sum, p) => sum + p.net_salary, 0);
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
