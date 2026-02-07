import { NextRequest, NextResponse } from 'next/server';
import { requiresPermissions } from '@/lib/auth/middleware';
import { employeeController } from '@/lib/controllers/employee.controller';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['employees.read'], async (authRequest) => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!organizationId) {
      return NextResponse.json({ 
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // If no query, get all employees for the organization
    let result;
    if (q && q.trim()) {
      // Search with query
      const employees = await employeeController.search(organizationId, q.trim(), limit);
      result = { data: employees, pagination: null };
    } else {
      // Get all employees with pagination
      result = await employeeController.getAll(organizationId, undefined, { page, limit });
    }

    const data = result.data.map(employee => ({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      customId: employee.customId,
      job_title: employee.jobTitle?.name || '',
      employmentStatus: employee.employmentStatus || 'ACTIVE',
    }));

    const pagination = result.pagination || {
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNext: false,
      hasPrev: page > 1
    };

    return NextResponse.json({ data, pagination });
  });
}
