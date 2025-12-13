import { NextRequest, NextResponse } from 'next/server';
import { organizationController } from '@/lib/controllers/organization.controller';
import { CreateOrganizationSchema } from '@/lib/models/organization';
import { requireAdmin } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAdmin(request, async (authRequest) => {
    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await organizationController.getAll({ page, limit });
    return NextResponse.json(result);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateOrganizationSchema.parse(body);
    
    const organization = await organizationController.create(validatedData);
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
