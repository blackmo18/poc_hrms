import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { getLeaveRequestService } from '@/lib/service';

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Get real leave requests for current employee
    const leaveRequestService = getLeaveRequestService();
    const employeeLeaveRequests = (await leaveRequestService.getByEmployeeId(userId))
      .map((request: any) => ({
        id: request.id,
        type: request.leaveType?.toLowerCase() as 'annual' | 'sick' | 'personal',
        startDate: request.startDate.toISOString().split('T')[0],
        endDate: request.endDate.toISOString().split('T')[0],
        status: request.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        days: Math.ceil(request.totalMinutes / (8 * 60)) // Convert minutes to days
      }))
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5); // Get 5 most recent

    return NextResponse.json(employeeLeaveRequests);
  } catch (error) {
    console.error('Error fetching employee leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee leave requests' },
      { status: 500 }
    );
  }
}
