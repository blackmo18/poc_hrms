import { NextRequest, NextResponse } from 'next/server';
import { employeeController } from '@/lib/controllers/employee.controller';
import { JWTUtils } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from JWT token
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = JWTUtils.verifyAccessToken(accessToken);
    const userId = payload.userId;

    // Fetch employee by user ID
    const employee = await employeeController.getByUserId(userId);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee by user ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}
