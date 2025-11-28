import { NextRequest, NextResponse } from 'next/server';
import { organizationController } from '@/lib/controllers/organization.controller';
import { CreateOrganizationSchema } from '@/lib/models/organization';

export async function GET(request: NextRequest) {
  try {
    const organizations = await organizationController.getAll();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
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
