import { NextRequest, NextResponse } from 'next/server';
import { EmployeeGovernmentInfoController } from '@/lib/controllers/employee-government-info.controller';
import { requiresPermissions } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';

const employeeGovernmentInfoController = new EmployeeGovernmentInfoController(prisma);

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['employees.read'], async (authRequest) => {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const organizationId = searchParams.get('organizationId');
    const searchType = searchParams.get('searchType') as 'sss' | 'philhealth' | 'pagibig' | 'tin';
    const searchNumber = searchParams.get('searchNumber');
    const exportData = searchParams.get('export');
    const format = searchParams.get('format') as 'csv' | 'excel';

    const user = authRequest.user!;
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isAdmin = user.roles.includes('ADMIN');
    const isHRManager = user.roles.includes('HR_MANAGER');

    // Determine organization ID
    let targetOrganizationId = organizationId;
    if (!isSuperAdmin && !isAdmin && !isHRManager) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (!isSuperAdmin && !targetOrganizationId) {
      targetOrganizationId = user.organizationId;
    }

    try {
      // Handle different GET operations
      if (employeeId) {
        const result = await employeeGovernmentInfoController.getEmployeeGovernmentInfo(
          employeeId,
          targetOrganizationId!
        );
        return NextResponse.json(result);
      }

      if (searchType && searchNumber) {
        const result = await employeeGovernmentInfoController.searchEmployeesByGovernmentNumber(
          targetOrganizationId!,
          searchType,
          searchNumber
        );
        return NextResponse.json(result);
      }

      if (exportData === 'true') {
        const result = await employeeGovernmentInfoController.exportGovernmentInfo(
          targetOrganizationId!,
          format || 'csv'
        );
        return NextResponse.json(result);
      }

      // Get all employees government info
      const result = await employeeGovernmentInfoController.getAllEmployeesGovernmentInfo(
        targetOrganizationId!
      );
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error in employee government info GET:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch employee government information' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['employees.update'], async (authRequest) => {
    try {
      const body = await request.json();
      const { organizationId, ...data } = body;

      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Determine organization ID
      let targetOrganizationId = organizationId;
      if (!isSuperAdmin && !targetOrganizationId) {
        targetOrganizationId = user.organizationId;
      }

      // Validate organization access
      if (!isSuperAdmin && targetOrganizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Cannot manage employee info for this organization' }, { status: 403 });
      }

      // Check if it's a bulk update
      if (Array.isArray(data)) {
        const result = await employeeGovernmentInfoController.bulkUpdateGovernmentInfo(
          targetOrganizationId!,
          data
        );
        return NextResponse.json(result);
      }

      // Single create
      const result = await employeeGovernmentInfoController.createEmployeeGovernmentInfo(
        targetOrganizationId!,
        data
      );
      return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
      console.error('Error in employee government info POST:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create employee government information' },
        { status: 500 }
      );
    }
  });
}
