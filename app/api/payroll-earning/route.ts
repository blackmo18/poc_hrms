import { NextRequest, NextResponse } from 'next/server';
import { getPayrollEarningService } from '@/lib/service';
import { CreatePayrollEarningSchema, BulkCreatePayrollEarningsSchema } from '@/lib/models';

const payrollEarningService = getPayrollEarningService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const payrollId = searchParams.get('payrollId');
    const employeeId = searchParams.get('employeeId');
    const type = searchParams.get('type');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (type && organizationId) {
      // Get earnings by type
      const earnings = await payrollEarningService.findByType(
        type as any,
        organizationId,
        periodStart ? new Date(periodStart) : undefined,
        periodEnd ? new Date(periodEnd) : undefined
      );
      return NextResponse.json(earnings);
    }

    // Get all earnings with filters
    const earnings = await payrollEarningService.getAll(
      organizationId || undefined,
      payrollId || undefined,
      employeeId || undefined,
      { page, limit }
    );

    return NextResponse.json(earnings);
  } catch (error: any) {
    console.error('Error fetching payroll earnings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payroll earnings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'bulk-create') {
      // Bulk create earnings
      const { earnings } = body;
      
      if (!earnings || !Array.isArray(earnings)) {
        return NextResponse.json(
          { error: 'Earnings array is required' },
          { status: 400 }
        );
      }

      const validatedData = BulkCreatePayrollEarningsSchema.parse(earnings);
      
      const result = await payrollEarningService.bulkCreate(validatedData);
      
      return NextResponse.json({ count: result.count }, { status: 201 });
    }

    // Create single earning
    // Validate request body
    const validatedData = CreatePayrollEarningSchema.parse(body);

    const earning = await payrollEarningService.create(validatedData);
    
    return NextResponse.json(earning, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payroll earning:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create payroll earning' },
      { status: 500 }
    );
  }
}
