import { NextRequest, NextResponse } from 'next/server';
import { getDeductionService } from '@/lib/service';
import { CreateDeductionSchema, BulkCreateDeductionsSchema } from '@/lib/models';

const deductionService = getDeductionService();

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
      // Get deductions by type
      const deductions = await deductionService.findByType(
        type,
        organizationId,
        periodStart ? new Date(periodStart) : undefined,
        periodEnd ? new Date(periodEnd) : undefined
      );
      return NextResponse.json(deductions);
    }

    // Get all deductions with filters
    const deductions = await deductionService.getAll(
      organizationId || undefined,
      payrollId || undefined,
      employeeId || undefined,
      { page, limit }
    );

    return NextResponse.json(deductions);
  } catch (error: any) {
    console.error('Error fetching deductions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deductions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'bulk-create') {
      // Bulk create deductions
      const { deductions } = body;
      
      if (!deductions || !Array.isArray(deductions)) {
        return NextResponse.json(
          { error: 'Deductions array is required' },
          { status: 400 }
        );
      }

      const validatedData = BulkCreateDeductionsSchema.parse(deductions);
      
      const result = await deductionService.bulkCreate(validatedData);
      
      return NextResponse.json({ count: result.count }, { status: 201 });
    }

    // Create single deduction
    // Validate request body
    const validatedData = CreateDeductionSchema.parse(body);

    const deduction = await deductionService.create(validatedData);
    
    return NextResponse.json(deduction, { status: 201 });
  } catch (error: any) {
    console.error('Error creating deduction:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create deduction' },
      { status: 500 }
    );
  }
}
