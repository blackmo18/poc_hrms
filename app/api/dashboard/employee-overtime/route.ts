import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session-validator';
import { overtimeRequestService } from '@/lib/service';

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

    // Get real overtime requests
    const allOvertimeRequests = await overtimeRequestService.getAll({ employeeId: userId });
    
    // Format overtime requests
    const employeeOvertimeRequests = (allOvertimeRequests.data || [])
      .map((request: any) => ({
        id: request.id,
        date: request.workDate.toISOString().split('T')[0],
        hours: Math.ceil(request.requestedMinutes / 60 * 10) / 10, // Convert minutes to hours with 1 decimal
        reason: request.reason || 'No reason provided',
        status: request.status.toLowerCase() as 'pending' | 'approved' | 'rejected'
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Get 5 most recent

    return NextResponse.json(employeeOvertimeRequests);
  } catch (error) {
    console.error('Error fetching employee overtime requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee overtime requests' },
      { status: 500 }
    );
  }
}
