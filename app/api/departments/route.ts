import { NextRequest, NextResponse } from 'next/server';
import { departmentController } from '@/lib/controllers/department.controller';
import { CreateDepartmentSchema } from '@/lib/models/department';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    const departments = await departmentController.getAll(
      BigInt(organizationId || '0')
    );
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateDepartmentSchema.parse(body);
    
    const department = await departmentController.create(validatedData);
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
