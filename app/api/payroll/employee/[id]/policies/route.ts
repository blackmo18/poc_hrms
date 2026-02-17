import { NextRequest, NextResponse } from 'next/server';
import { requiresAdmin, requiresPermissions } from '@/lib/auth/middleware';
import { getLateDeductionPolicyService } from '@/lib/service/late-deduction-policy.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresAdmin(request, async (authRequest) => {
    try {
      const { id: employeeId } = await params;
      
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      // Check user permissions for the organization
      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Super Admin can access any organization
      // Admin and HR Manager can only access their own organization
      if (!isSuperAdmin && !isAdmin && (!isHRManager || organizationId !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot access data for this organization' },
          { status: 403 }
        );
      }

      const lateDeductionPolicyService = getLateDeductionPolicyService();

      // Get late policy
      const latePolicy = await lateDeductionPolicyService.getPolicyByType(
        organizationId,
        'LATE',
        new Date() // Use current date
      );

      // Get absence policy (using UNDERTIME for absences)
      const absencePolicy = await lateDeductionPolicyService.getPolicyByType(
        organizationId,
        'UNDERTIME',
        new Date() // Use current date
      );

      // Transform the data to match the expected format
      const applicablePolicies = {
        latePolicy: latePolicy ? {
          type: latePolicy.policyType,
          deductionMethod: latePolicy.deductionMethod,
          rate: latePolicy.deductionMethod === 'HOURLY_RATE' 
            ? latePolicy.hourlyRateMultiplier || 0
            : latePolicy.deductionMethod === 'PERCENTAGE'
            ? latePolicy.percentageRate || 0
            : latePolicy.fixedAmount || 0,
          gracePeriodMinutes: latePolicy.gracePeriodMinutes || 0,
          maxDeductionPerDay: latePolicy.maxDeductionPerDay || 0,
        } : null,
        absencePolicy: absencePolicy ? {
          deductionMethod: absencePolicy.deductionMethod,
          rate: absencePolicy.deductionMethod === 'HOURLY_RATE'
            ? absencePolicy.hourlyRateMultiplier || 0
            : absencePolicy.deductionMethod === 'PERCENTAGE'
            ? absencePolicy.percentageRate || 0
            : absencePolicy.fixedAmount || 0,
          maxDeductionPerDay: absencePolicy.maxDeductionPerDay || 0,
        } : null,
      };

      return NextResponse.json(applicablePolicies);
    } catch (error) {
      console.error('Error fetching applicable policies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applicable policies' },
        { status: 500 }
      );
    }
  });
}
