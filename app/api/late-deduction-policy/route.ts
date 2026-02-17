import { NextRequest, NextResponse } from 'next/server';
import { getLateDeductionPolicyService } from '@/lib/service';
import { CreateLateDeductionPolicySchema, UpdateLateDeductionPolicySchema } from '@/lib/models';

const lateDeductionPolicyService = getLateDeductionPolicyService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const active = searchParams.get('active') === 'true';
    const policyType = searchParams.get('policyType');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (active) {
      // Get active policies
      const policies = await lateDeductionPolicyService.getActivePolicies(organizationId);
      return NextResponse.json(policies);
    }

    if (policyType) {
      // Get policies by type
      const policy = await lateDeductionPolicyService.getPolicyByType(
        organizationId,
        policyType as any
      );
      return NextResponse.json(policy || []);
    }

    // Get all policies with pagination
    const policies = await lateDeductionPolicyService.getAll(organizationId, {
      page,
      limit,
    });

    return NextResponse.json(policies);
  } catch (error: any) {
    console.error('Error fetching late deduction policies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch late deduction policies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = CreateLateDeductionPolicySchema.parse(body);

    const policy = await lateDeductionPolicyService.create(organizationId, validatedData);
    
    return NextResponse.json(policy, { status: 201 });
  } catch (error: any) {
    console.error('Error creating late deduction policy:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create late deduction policy' },
      { status: 500 }
    );
  }
}
