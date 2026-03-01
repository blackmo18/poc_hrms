import { NextRequest, NextResponse } from 'next/server';
import { getDeductionService } from '@/lib/service';
import { UpdateDeductionSchema } from '@/lib/models';

const deductionService = getDeductionService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const deduction = await deductionService.getById(
      id,
      organizationId || undefined
    );

    return NextResponse.json(deduction);
  } catch (error: any) {
    console.error('Error fetching deduction:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deduction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deduction' },
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
    const validatedData = UpdateDeductionSchema.parse(body);

    const deduction = await deductionService.update(
      id,
      organizationId,
      validatedData
    );

    return NextResponse.json(deduction);
  } catch (error: any) {
    console.error('Error updating deduction:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deduction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update deduction' },
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

    const deduction = await deductionService.delete(id, organizationId);

    return NextResponse.json(deduction);
  } catch (error: any) {
    console.error('Error deleting deduction:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deduction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete deduction' },
      { status: 500 }
    );
  }
}
