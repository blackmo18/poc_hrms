import { NextRequest, NextResponse } from 'next/server';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { checkPermission, getUserInfo } from '@/lib/middleware/simple-permission.middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check permission first - straightforward and explicit
  const permissionResult = await checkPermission(request, 'payroll.void');
  
  // Handle permission errors
  if (permissionResult instanceof NextResponse) {
    return permissionResult; // This is the 401/403 error response
  }
  
  // Extract user info
  const { userId } = getUserInfo(permissionResult.user);
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const payroll = await payrollController.voidPayroll(id, userId, reason);
    return NextResponse.json(payroll);
  } catch (error) {
    console.error('Error voiding payroll:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to void payroll' },
      { status: 500 }
    );
  }
}
