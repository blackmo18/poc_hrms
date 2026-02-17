import { NextRequest, NextResponse } from 'next/server';
import { getPayrollEarningService } from '@/lib/service';
import { UpdatePayrollEarningSchema } from '@/lib/models';

const payrollEarningService = getPayrollEarningService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const earning = await payrollEarningService.getById(
      id,
      organizationId || undefined
    );

    return NextResponse.json(earning);
  } catch (error: any) {
    console.error('Error fetching payroll earning:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll earning not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payroll earning' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = UpdatePayrollEarningSchema.parse(body);

    const earning = await payrollEarningService.update(
      id,
      organizationId,
      validatedData
    );

    return NextResponse.json(earning);
  } catch (error: any) {
    console.error('Error updating payroll earning:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll earning not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update payroll earning' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const earning = await payrollEarningService.delete(id, organizationId);

    return NextResponse.json(earning);
  } catch (error: any) {
    console.error('Error deleting payroll earning:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Payroll earning not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete payroll earning' },
      { status: 500 }
    );
  }
}
