import { NextRequest, NextResponse } from 'next/server';
import { getPayrollPeriodService } from '@/lib/service';
import { UpdatePayrollPeriodSchema } from '@/lib/models';

const payrollPeriodService = getPayrollPeriodService();

export async function GET(
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

    const period = await payrollPeriodService.getById(
      orgId,
      start,
      end
    );

    return NextResponse.json(period);
  } catch (error: any) {
    console.error('Error fetching payroll period:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll period not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payroll period' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; startDate: string; endDate: string }> }
) {
  try {
    const { orgId, startDate, endDate } = await params;
    const body = await request.json();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = UpdatePayrollPeriodSchema.parse(body);

    const period = await payrollPeriodService.update(
      orgId,
      start,
      end,
      validatedData
    );

    return NextResponse.json(period);
  } catch (error: any) {
    console.error('Error updating payroll period:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll period not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update payroll period' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const period = await payrollPeriodService.delete(
      orgId,
      start,
      end
    );

    return NextResponse.json(period);
  } catch (error: any) {
    console.error('Error deleting payroll period:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll period not found' },
        { status: 404 }
      );
    }
    
    if (error.message.includes('existing payrolls')) {
      return NextResponse.json(
        { error: 'Cannot delete payroll period with existing payroll records' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete payroll period' },
      { status: 500 }
    );
  }
}
