import { NextRequest, NextResponse } from 'next/server';
import { jobTitleController } from '@/lib/controllers/job-title.controller';
import { CreateJobTitleSchema } from '@/lib/models/job-title';
import { requiresRoles } from '@/lib/auth/middleware';
import { ulid } from 'ulid';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  return requiresRoles(request, ['ADMIN', 'SUPER_ADMIN'], async (authRequest) => {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const organizationPublicId = searchParams.get('organization_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get user info from auth request
    const user = authRequest.user!;

    // Check user role
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isAdmin = user.roles.includes('ADMIN');

    let result;

    if (isSuperAdmin) {
      // Super Admin can see all job titles across all organizations
      let numericOrgId: number | undefined;
      if (organizationPublicId) {
        // Look up the organization by public_id to get its numeric ID
        const org = await prisma.organization.findUnique({
          where: { public_id: organizationPublicId },
          select: { id: true },
        });
        numericOrgId = org?.id;
      }
      result = await jobTitleController.getAll(
        numericOrgId,
        { page, limit }
      );
    } else if (isAdmin) {
      // Admin can see job titles in their organization only
      result = await jobTitleController.getAll(user.organizationId, { page, limit });
    } else {
      // Regular employees might have limited access or no access
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(result);
  });
}

export async function POST(request: NextRequest) {
  return requiresRoles(request, ['ADMIN', 'SUPER_ADMIN'], async (authRequest) => {
    try {
      const body = await request.json();
      const validatedData = CreateJobTitleSchema.parse(body);

      // Get user info from auth request
      const user = authRequest.user!;

      // Check if user can create job titles for the specified organization
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');

      // Super Admin can create job titles for any organization
      // Admin can only create for their own organization
      if (!isSuperAdmin && (!isAdmin || validatedData.organization_id !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot create job titles for this organization' },
          { status: 403 }
        );
      }

      const jobTitle = await jobTitleController.create({ ...validatedData, public_id: ulid() });
      return NextResponse.json(jobTitle, { status: 201 });
    } catch (error) {
      console.error('Error creating job title:', error);
      return NextResponse.json(
        { error: 'Failed to create job title' },
        { status: 500 }
      );
    }
  });
}
