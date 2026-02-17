import { NextRequest, NextResponse } from 'next/server';
import { getCompensationService } from '@/lib/service/compensation.service';
import { UpdateCompensationSchema } from '@/lib/models/compensation';
import { requiresPermissions } from '@/lib/auth/middleware';

const compensationService = getCompensationService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['compensation.read'], async (authRequest) => {
    try {
      const { id } = await params;
      const compensationId = id;

      const compensation = await compensationService.getById(compensationId);

      if (!compensation) {
        return NextResponse.json(
          { error: 'Compensation not found' },
          { status: 404 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');

      // Check organization access
      if (!isAdmin && compensation.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Access denied to this compensation' },
          { status: 403 }
        );
      }

      return NextResponse.json(compensation);
    } catch (error) {
      console.error('Error fetching compensation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch compensation' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['compensation.update'], async (authRequest) => {
    try {
      const { id } = await params;
      const compensationId = id;

      const body = await request.json();

      // Parse effectiveDate if provided
      if (body.effectiveDate) {
        body.effectiveDate = new Date(body.effectiveDate);
      }

      const validatedData = UpdateCompensationSchema.parse(body);

      // Check if compensation exists and user has access
      const existingCompensation = await compensationService.getById(compensationId);
      if (!existingCompensation) {
        return NextResponse.json(
          { error: 'Compensation not found' },
          { status: 404 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');

      // Check organization access
      if (!isAdmin && existingCompensation.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Cannot update compensation from this organization' },
          { status: 403 }
        );
      }

      const compensation = await compensationService.update(compensationId, validatedData);
      return NextResponse.json(compensation);
    } catch (error) {
      console.error('Error updating compensation:', error);
      return NextResponse.json(
        { error: 'Failed to update compensation' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresPermissions(request, ['compensation.delete'], async (authRequest) => {
    try {
      const { id } = await params;
      const compensationId = id;

      // Check if compensation exists and user has access
      const existingCompensation = await compensationService.getById(compensationId);
      if (!existingCompensation) {
        return NextResponse.json(
          { error: 'Compensation not found' },
          { status: 404 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');

      // Check organization access
      if (!isAdmin && existingCompensation.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: 'Cannot delete compensation from this organization' },
          { status: 403 }
        );
      }

      await compensationService.delete(compensationId);
      return NextResponse.json({ message: 'Compensation deleted successfully' });
    } catch (error) {
      console.error('Error deleting compensation:', error);
      return NextResponse.json(
        { error: 'Failed to delete compensation' },
        { status: 500 }
      );
    }
  });
}
