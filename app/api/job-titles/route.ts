import { NextRequest, NextResponse } from 'next/server';
import { jobTitleController } from '@/lib/controllers/job-title.controller';
import { CreateJobTitleSchema } from '@/lib/models/job-title';
import { requireAdmin } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    const jobTitles = await jobTitleController.getAll(
      organizationId ? Number(organizationId) : undefined
    );

    return NextResponse.json(jobTitles);
  });
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    try {
      const body = await request.json();
      const validatedData = CreateJobTitleSchema.parse(body);

      const jobTitle = await jobTitleController.create(validatedData);
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
