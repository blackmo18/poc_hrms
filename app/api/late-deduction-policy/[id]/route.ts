import { NextRequest, NextResponse } from 'next/server';
import { getLateDeductionPolicyService } from '@/lib/service';
import { UpdateLateDeductionPolicySchema } from '@/lib/models';

const lateDeductionPolicyService = getLateDeductionPolicyService();

export async function GET(
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

    const policy = await lateDeductionPolicyService.getById(
      id,
      organizationId
    );

    return NextResponse.json(policy);
  } catch (error: any) {
    console.error('Error fetching late deduction policy:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Late deduction policy not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch late deduction policy' },
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
    const validatedData = UpdateLateDeductionPolicySchema.parse(body);

    const policy = await lateDeductionPolicyService.update(
      id,
      organizationId,
      validatedData
    );

    return NextResponse.json(policy);
  } catch (error: any) {
    console.error('Error updating late deduction policy:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Late deduction policy not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update late deduction policy' },
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

    const policy = await lateDeductionPolicyService.delete(
      id,
      organizationId
    );

    return NextResponse.json(policy);
  } catch (error: any) {
    console.error('Error deleting late deduction policy:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Late deduction policy not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete late deduction policy' },
      { status: 500 }
    );
  }
}
