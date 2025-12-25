import { NextRequest, NextResponse } from 'next/server';
import { requiresPermissions } from '@/lib/auth/middleware';
import { employeeController } from '@/lib/controllers/employee.controller';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['employees.read'], async (authRequest) => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const organizationId = searchParams.get('organizationId');

    if (!q || !organizationId) {
      return NextResponse.json({ data: [] });
    }

    const employees = await employeeController.search(organizationId, q, 10);

    const data = employees.map(employee => ({
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      custom_id: employee.custom_id,
      job_title: employee.jobTitle?.name || '',
    }));

    return NextResponse.json({ data });
  });
}
