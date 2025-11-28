import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestController } from '@/lib/controllers/leave-request.controller';
import { CreateLeaveRequestSchema } from '@/lib/models/leave-request';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    
    const leaveRequests = await leaveRequestController.getAll(
      employeeId || undefined,
      status || undefined
    );
    
    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateLeaveRequestSchema.parse(body);
    
    const leaveRequest = await leaveRequestController.create(validatedData);
    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
