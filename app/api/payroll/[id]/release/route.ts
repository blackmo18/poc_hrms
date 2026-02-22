import { NextRequest, NextResponse } from 'next/server';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['payroll.release'], async (authRequest) => {
    try {
      const { id } = await params;
      
      const payroll = await payrollController.releasePayroll(id, authRequest.user.id);
      return NextResponse.json(payroll);
    } catch (error) {
      console.error('Error releasing payroll:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to release payroll' },
        { status: 500 }
      );
    }
  });
}
