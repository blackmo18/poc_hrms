import { NextRequest, NextResponse } from 'next/server';
import { getCompensationService } from '@/lib/service/compensation.service';
import { CreateCompensationSchema } from '@/lib/models/compensation';
import { requiresPermissions } from '@/lib/auth/middleware';

const compensationService = getCompensationService();

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['compensation.read'], async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employeeId');
      const organizationId = searchParams.get('organizationId');

      let compensations;

      if (employeeId) {
        compensations = await compensationService.getByEmployeeId(employeeId);
      } else {
        compensations = await compensationService.getAll();
      }

      // Filter by organization if not admin
      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
      
      if (!isAdmin && organizationId && user.organizationId !== organizationId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // If not admin, filter by user's organization
      if (!isAdmin) {
        compensations = compensations.filter(c => c.organizationId === user.organizationId);
      }

      return NextResponse.json(compensations);
    } catch (error) {
      console.error('Error fetching compensations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch compensations' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['compensation.create'], async (authRequest) => {
    try {
      const body = await request.json();

      // Parse effectiveDate
      if (body.effectiveDate) {
        body.effectiveDate = new Date(body.effectiveDate);
      }

      const validatedData = CreateCompensationSchema.parse(body);

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');

      // Check organization access
      if (!isAdmin && validatedData.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Cannot create compensation for this organization' },
          { status: 403 }
        );
      }

      const compensation = await compensationService.create(validatedData);
      return NextResponse.json(compensation, { status: 201 });
    } catch (error) {
      console.error('Error creating compensation:', error);
      return NextResponse.json(
        { error: 'Failed to create compensation' },
        { status: 500 }
      );
    }
  });
}
