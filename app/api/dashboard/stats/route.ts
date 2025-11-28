import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const [
      totalEmployees,
      totalDepartments,
      payrollTotal,
      pendingLeaveRequests
    ] = await Promise.all([
      prisma.employee.count({
        where: { employment_status: 'ACTIVE' }
      }),
      prisma.department.count(),
      prisma.payroll.aggregate({
        _sum: { net_salary: true }
      }),
      prisma.leaveRequest.count({
        where: { status: 'PENDING' }
      })
    ]);

    const stats = {
      totalEmployees,
      totalDepartments,
      totalPayroll: payrollTotal._sum.net_salary || 0,
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
