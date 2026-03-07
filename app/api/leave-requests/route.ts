import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestController } from '@/lib/controllers/leave-request.controller';
import { CreateLeaveRequestSchema } from '@/lib/models/leave-request';
import { ensureUTCForStorage } from '@/lib/utils/timezone-utils';
import { z } from 'zod';

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
    
    // Create a schema that accepts ISO strings and converts them to dates
    const CreateLeaveRequestWithTimezoneSchema = CreateLeaveRequestSchema.extend({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/, 'Invalid start date format (use ISO format with timezone)'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/, 'Invalid end date format (use ISO format with timezone)'),
    });
    
    const validatedData = CreateLeaveRequestWithTimezoneSchema.parse(body);
    
    console.log('Leave Request API - Converting dates:', {
      startDate: validatedData.startDate,
      endDate: validatedData.endDate
    });
    
    // Convert ISO strings to UTC dates
    const leaveRequestData = {
      ...validatedData,
      startDate: ensureUTCForStorage(validatedData.startDate),
      endDate: ensureUTCForStorage(validatedData.endDate),
    };
    
    console.log('Leave Request API - Converted to UTC:', {
      startDate: leaveRequestData.startDate.toISOString(),
      endDate: leaveRequestData.endDate.toISOString()
    });
    
    const leaveRequest = await leaveRequestController.create(leaveRequestData);
    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
