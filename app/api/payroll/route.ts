import { NextRequest, NextResponse } from 'next/server';
import { payrollController } from '@/lib/controllers/payroll.controller';
import { CreatePayrollSchema } from '@/lib/models/payroll';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const periodStart = searchParams.get('periodStart') ? new Date(searchParams.get('periodStart')!) : undefined;
    const periodEnd = searchParams.get('periodEnd') ? new Date(searchParams.get('periodEnd')!) : undefined;
    
    const payrolls = await payrollController.getAll(
      employeeId ?? undefined,
      periodStart,
      periodEnd
    );
    
    return NextResponse.json(payrolls);
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payrolls' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'process') {
      const { employeeId, organizationId, departmentId, periodStart, periodEnd } = body;
      const payroll = await payrollController.processPayroll(
        employeeId,
        organizationId,
        departmentId,
        new Date(periodStart),
        new Date(periodEnd)
      );
      return NextResponse.json(payroll, { status: 201 });
    }
    
    const validatedData = CreatePayrollSchema.parse(body);
    const payroll = await payrollController.create(validatedData);
    return NextResponse.json(payroll, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json(
      { error: 'Failed to create payroll' },
      { status: 500 }
    );
  }
}
