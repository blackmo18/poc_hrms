import { NextRequest, NextResponse } from 'next/server';
import { getWorkScheduleService } from '@/lib/service';
import { UpdateWorkScheduleSchema } from '@/lib/models';

const workScheduleService = getWorkScheduleService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const schedule = await workScheduleService.getById(id, organizationId);

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('Error fetching work schedule:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Work schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch work schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateWorkScheduleSchema.parse(body);

    const schedule = await workScheduleService.update(id, validatedData);

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('Error updating work schedule:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Work schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update work schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = await workScheduleService.delete(id);

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('Error deleting work schedule:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Work schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete work schedule' },
      { status: 500 }
    );
  }
}
