import { NextRequest, NextResponse } from 'next/server';
import { getPayrollPeriodService } from '@/lib/service';
import { CreatePayrollPeriodSchema, GeneratePayrollPeriodsSchema } from '@/lib/models';

const payrollPeriodService = getPayrollPeriodService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const current = searchParams.get('current') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (current) {
      // Get current payroll period
      const period = await payrollPeriodService.getCurrentPeriod(organizationId);
      return NextResponse.json(period);
    }

    if (year) {
      // Get periods by year
      const periods = await payrollPeriodService.getPeriodsByYear(
        organizationId,
        parseInt(year)
      );
      return NextResponse.json(periods);
    }

    if (status) {
      // Get periods by status
      const periods = await payrollPeriodService.getPeriodsByStatus(
        organizationId,
        status
      );
      return NextResponse.json(periods);
    }

    // Get all periods with pagination
    const periods = await payrollPeriodService.getAll(organizationId, {
      page,
      limit,
    });

    return NextResponse.json(periods);
  } catch (error: any) {
    console.error('Error fetching payroll periods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payroll periods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'generate') {
      // Generate multiple periods
      const validatedData = GeneratePayrollPeriodsSchema.parse(body);
      
      const periods = await payrollPeriodService.generatePeriods(
        validatedData.organizationId,
        validatedData.type,
        validatedData.startDate,
        validatedData.endDate,
        validatedData.payDayOffset
      );
      
      return NextResponse.json(periods, { status: 201 });
    }

    // Create single period
    const { organizationId } = body;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = CreatePayrollPeriodSchema.parse(body);

    const period = await payrollPeriodService.create(organizationId, validatedData);
    
    return NextResponse.json(period, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payroll period:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create payroll period' },
      { status: 500 }
    );
  }
}
