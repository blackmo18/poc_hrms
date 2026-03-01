import { NextRequest, NextResponse } from 'next/server';
import { getWorkScheduleService } from '@/lib/service';
import { CreateWorkScheduleSchema, UpdateWorkScheduleSchema } from '@/lib/models';

const workScheduleService = getWorkScheduleService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const employeeId = searchParams.get('employeeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (employeeId) {
      // Get schedule by employee
      const schedule = await workScheduleService.getByEmployeeId(employeeId);
      return NextResponse.json(schedule);
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get all schedules with pagination
    const schedules = await workScheduleService.getAll(organizationId, {
      page,
      limit,
    });

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error('Error fetching work schedules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch work schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateWorkScheduleSchema.parse(body);

    const schedule = await workScheduleService.create(validatedData);
    
    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating work schedule:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create work schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Validate updates
    const validatedUpdates = updates.map(update => 
      UpdateWorkScheduleSchema.parse(update)
    );

    const result = await workScheduleService.bulkUpdate(
      validatedUpdates.map((update, index) => ({
        id: updates[index].id,
        data: update,
      }))
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error bulk updating work schedules:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update work schedules' },
      { status: 500 }
    );
  }
}
