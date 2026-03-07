import { NextRequest, NextResponse } from 'next/server';
import { leaveRequestController } from '@/lib/controllers/leave-request.controller';
import { CreateLeaveRequestSchema } from '@/lib/models/leave-request';
import { ensureUTCForStorage } from '@/lib/utils/timezone-utils';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { JWTUtils } from '@/lib/auth/jwt';
import { getUserRoles, getUserPermissions } from '@/lib/auth/auth-db';
import { getUserService } from '@/lib/service';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Use the same authentication method as /api/auth/session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      console.log('Leave Requests API - No session token found');
      return NextResponse.json(
        { error: 'Authentication required. Please log in again.' },
        { status: 401 }
      );
    }

    // Verify the session token (JWT)
    const payload = JWTUtils.verifyAccessToken(sessionToken);

    // Verify session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      console.log('Leave Requests API - Session invalid or expired');
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    console.log('Leave Requests API - Auth successful:', { userId: payload.userId });

    // Get user's organizationId and employeeId from the database
    const userService = getUserService();
    const user = await userService.getById(payload.userId);

    console.log('Leave Requests API - User data from database:', {
      userId: payload.userId,
      userFound: !!user,
      userData: user ? {
        id: user.id,
        email: user.email,
        employeeId: user.employeeId,
        organizationId: user.organizationId
      } : null
    });

    if (!user) {
      console.log('Leave Requests API - User not found in database');
      return NextResponse.json(
        { error: 'User profile not found. Please contact administrator.' },
        { status: 404 }
      );
    }

    if (!user.employeeId) {
      console.error('Leave Requests API - User has no employeeId mapped:', {
        userId: user.id,
        email: user.email,
        employeeId: user.employeeId
      });
      return NextResponse.json(
        { error: 'User account is not linked to an employee profile. Please contact administrator to map your user account to an employee record.' },
        { status: 400 }
      );
    }

    console.log('Leave Requests API - User data:', { 
      userId: user.id, 
      employeeId: user.employeeId, 
      organizationId: user.organizationId 
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Filter by current user's employee ID
    const leaveRequests = await leaveRequestController.getAll(
      user.employeeId,
      status || undefined
    );
    
    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get user from session (same as GET)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in again.' },
        { status: 401 }
      );
    }

    const payload = JWTUtils.verifyAccessToken(sessionToken);
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      select: { userId: true, expires: true }
    });

    if (!session || new Date() > session.expires) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Create a custom schema for API input (no userId needed - comes from session)
    const CreateLeaveRequestAPISchema = z.object({
      organizationId: z.string().min(1, 'Organization ID is required'),
      leaveType: z.enum(['VACATION', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID']),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/, 'Invalid start date format (use ISO format with timezone)'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/, 'Invalid end date format (use ISO format with timezone)'),
      remarks: z.string().optional(),
    });
    
    const validatedData = CreateLeaveRequestAPISchema.parse(body);
    
    // Get user service to retrieve employee ID
    const { getUserService } = await import('@/lib/service');
    const userService = getUserService();
    
    // Get user from database to retrieve employeeId (using session userId)
    const user = await userService.getById(payload.userId);
    
    console.log('Leave Request API - User data from database:', {
      userId: payload.userId,
      userFound: !!user,
      userData: user ? {
        id: user.id,
        email: user.email,
        employeeId: user.employeeId,
        organizationId: user.organizationId
      } : null
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    if (!user.employeeId) {
      console.error('Leave Request API - User has no employeeId mapped:', {
        userId: user.id,
        email: user.email,
        employeeId: user.employeeId
      });
      return NextResponse.json(
        { error: 'User account is not linked to an employee profile. Please contact administrator to map your user account to an employee record.' },
        { status: 400 }
      );
    }
    
    console.log('Leave Request API - Creating request for user:', { 
      userId: payload.userId, 
      employeeId: user.employeeId 
    });
    
    // Convert ISO strings to UTC dates and use employeeId from session
    const leaveRequestData = {
      employeeId: user.employeeId, // Use employeeId from user record (via session)
      organizationId: validatedData.organizationId,
      leaveType: validatedData.leaveType,
      startDate: ensureUTCForStorage(validatedData.startDate),
      endDate: ensureUTCForStorage(validatedData.endDate),
      isPaid: true, // Default to paid leave
      status: 'PENDING' as const, // New leave requests start as pending
      remarks: validatedData.remarks,
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
