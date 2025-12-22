import { NextRequest, NextResponse } from 'next/server';
import { organizationController } from '@/lib/controllers/organization.controller';
import { UpdateOrganizationSchema } from '@/lib/models/organization';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ public_id: string }> }
) {
  try {
    const { public_id } = await params;
    const organization = await organizationController.getByPublicId(public_id);
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ public_id: string }> }
) {
  try {
    const { public_id } = await params;
    const body = await request.json();
    
    // Validate update data
    const validatedData = UpdateOrganizationSchema.parse(body);
    const organization = await organizationController.updateByPublicId(public_id, validatedData);
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid organization data', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ public_id: string }> }
) {
  try {
    const { public_id } = await params;
    await organizationController.deleteByPublicId(public_id);
    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
