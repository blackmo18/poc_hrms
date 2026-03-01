import { NextRequest, NextResponse } from 'next/server';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['payroll.approve'], async (authRequest) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { reason } = body;
      
      const payroll = await payrollController.approvePayroll(id, authRequest.user.id, reason);
      return NextResponse.json(payroll);
    } catch (error) {
      console.error('Error approving payroll:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to approve payroll' },
        { status: 500 }
      );
    }
  });
}
