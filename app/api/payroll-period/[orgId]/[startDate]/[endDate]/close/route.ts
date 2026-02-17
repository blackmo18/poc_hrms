import { NextRequest, NextResponse } from 'next/server';
import { getPayrollPeriodService } from '@/lib/service';

const payrollPeriodService = getPayrollPeriodService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; startDate: string; endDate: string }> }
) {
  try {
    const { orgId, startDate, endDate } = await params;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const period = await payrollPeriodService.closePeriod(
      orgId,
      start,
      end
    );

    return NextResponse.json(period);
  } catch (error: any) {
    console.error('Error closing payroll period:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll period not found' },
        { status: 404 }
      );
    }
    
    if (error.message.includes('already completed')) {
      return NextResponse.json(
        { error: 'Payroll period is already completed' },
        { status: 400 }
      );
    }
    
    if (error.message.includes('cancelled')) {
      return NextResponse.json(
        { error: 'Cannot close a cancelled payroll period' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to close payroll period' },
      { status: 500 }
    );
  }
}
