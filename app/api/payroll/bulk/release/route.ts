import { NextRequest, NextResponse } from 'next/server';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['payroll.release'], async (authRequest) => {
    try {
      const body = await request.json();
      const { payrollIds, reason } = body;

      if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
        return NextResponse.json(
          { error: 'Payroll IDs array is required' },
          { status: 400 }
        );
      }

      const results = {
        success: [] as any[],
        failures: [] as { id: string; error: string }[]
      };

      // Process each payroll
      for (const payrollId of payrollIds) {
        try {
          const payroll = await payrollController.releasePayroll(payrollId, authRequest.user.id);
          results.success.push(payroll);
        } catch (error) {
          results.failures.push({
            id: payrollId,
            error: error instanceof Error ? error.message : 'Failed to release payroll'
          });
        }
      }

      return NextResponse.json(results);
    } catch (error) {
      console.error('Error in bulk release payroll:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
