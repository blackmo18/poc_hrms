import { NextRequest, NextResponse } from 'next/server';
import { payrollLogService } from '@/lib/service/payroll-log.service';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['payroll.logs.read'], async (authRequest) => {
    try {
      const { id } = await params;
      const logs = await payrollLogService.getPayrollHistory(id);
      return NextResponse.json(logs);
    } catch (error) {
      console.error('Error fetching payroll logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payroll logs' },
        { status: 500 }
      );
    }
  });
}
