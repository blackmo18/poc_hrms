import { NextRequest, NextResponse } from 'next/server';
import { jobTitleController } from '@/lib/controllers/job-title.controller';
import { UpdateJobTitleSchema } from '@/lib/models/job-title';
import { requiresRoles } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ['ADMIN', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { id } = await params;
      const jobTitleId = id;

      const jobTitle = await jobTitleController.getById(jobTitleId);

      if (!jobTitle) {
        return NextResponse.json(
          { error: 'Job title not found' },
          { status: 404 }
        );
      }

      // Get user info from auth request
      const user = authRequest.user!;

      // Check if user can access this job title
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');

      if (!isSuperAdmin && (!isAdmin || jobTitle.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Access denied to this job title' },
          { status: 403 }
        );
      }

      return NextResponse.json(jobTitle);
    } catch (error) {
      console.error('Error fetching job title:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job title' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ['ADMIN', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { id } = await params;
      const jobTitleId = id;

      const body = await request.json();
      const validatedData = UpdateJobTitleSchema.parse(body);

      // Get user info from auth request
      const user = authRequest.user!;

      // Check if user can update this job title
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');

      if (!isSuperAdmin && (!isAdmin || validatedData.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot update job titles for this organization' },
          { status: 403 }
        );
      }

      const jobTitle = await jobTitleController.update(jobTitleId, validatedData);
      return NextResponse.json(jobTitle);
    } catch (error) {
      console.error('Error updating job title:', error);
      return NextResponse.json(
        { error: 'Failed to update job title' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ['ADMIN', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const { id } = await params;
      const jobTitleId = id;

      // Get user info from auth request
      const user = authRequest.user!;

      // First check if the job title exists and belongs to user's organization
      const jobTitle = await jobTitleController.getById(jobTitleId);

      if (!jobTitle) {
        return NextResponse.json(
          { error: 'Job title not found' },
          { status: 404 }
        );
      }

      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');

      if (!isSuperAdmin && (!isAdmin || jobTitle.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot delete job titles for this organization' },
          { status: 403 }
        );
      }

      await jobTitleController.delete(jobTitleId);
      return NextResponse.json({ message: 'Job title deleted successfully' });
    } catch (error) {
      console.error('Error deleting job title:', error);
      return NextResponse.json(
        { error: 'Failed to delete job title' },
        { status: 500 }
      );
    }
  });
}
