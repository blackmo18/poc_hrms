import { NextRequest, NextResponse } from 'next/server';
import { getPayrollService } from '@/lib/service/payroll.service';
import { requiresPermissions } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['payroll.read'], async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const employeeId = searchParams.get('employeeId');
      const organizationId = searchParams.get('organizationId');
      const periodStart = searchParams.get('periodStart');
      const periodEnd = searchParams.get('periodEnd');

      if (!employeeId || !organizationId || !periodStart || !periodEnd) {
        return NextResponse.json(
          { error: 'Missing required query parameters' },
          { status: 400 }
        );
      }

      const payrollService = getPayrollService();

      // Get payrolls for the employee
      const payrolls = await payrollService.getByEmployeeId(employeeId);

      // Find the payroll for the specific period
      const payroll = payrolls.find(p =>
        p.periodStart.getTime() === new Date(periodStart).getTime() &&
        p.periodEnd.getTime() === new Date(periodEnd).getTime()
      );

      if (!payroll) {
        return NextResponse.json({
          exists: false,
          status: null,
          payroll: null
        });
      }

      return NextResponse.json({
        exists: true,
        status: payroll.status,
        payroll: {
          id: payroll.id,
          employeeId: payroll.employeeId,
          organizationId: payroll.organizationId,
          departmentId: payroll.departmentId,
          periodStart: payroll.periodStart,
          periodEnd: payroll.periodEnd,
          grossPay: payroll.grossPay,
          netPay: payroll.netPay,
          taxableIncome: payroll.taxableIncome,
          status: payroll.status,
          approvedAt: payroll.approvedAt,
          approvedBy: payroll.approvedBy,
          releasedAt: payroll.releasedAt,
          releasedBy: payroll.releasedBy,
          voidedAt: payroll.voidedAt,
          voidedBy: payroll.voidedBy,
          voidReason: payroll.voidReason,
          processedAt: payroll.processedAt,
        }
      });

    } catch (error: any) {
      console.error('Payroll GET API error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['payroll.create'], async (authRequest) => {
    try {
      const body = await request.json();
      const { action, employeeId, organizationId, departmentId, periodStart, periodEnd, reason } = body;

       // Validate organization access
      const userOrganizationId = authRequest.user.organizationId;
      const isSuperAdmin = authRequest.user.roles?.includes('SUPER_ADMIN');
      // Super admins can access any organization, regular users can only access their own
      if (!isSuperAdmin) {
        if (userOrganizationId && organizationId !== userOrganizationId) {
          console.log(`[PAYROLL_ACCESS] Access denied`, JSON.stringify({
            timestamp: new Date().toISOString(),
            userId: authRequest.user.id,
            userOrganizationId,
            requestedOrganizationId: organizationId,
            action,
            status: 'ACCESS_DENIED'
          }));
          return NextResponse.json(
            { error: 'Access denied: You can only generate payroll for your own organization' },
            { status: 403 }
          );
        }
      }

      const payrollService = getPayrollService();

      switch (action) {
        case 'generate': {
          if (!employeeId || !organizationId || !periodStart || !periodEnd) {
            return NextResponse.json(
              { error: 'Missing required fields: employeeId, organizationId, periodStart, periodEnd' },
              { status: 400 }
            );
          }

          const result = await payrollService.generatePayroll(
            {
              employeeId,
              organizationId,
              periodStart: new Date(periodStart),
              periodEnd: new Date(periodEnd),
            },
            authRequest.user.id
          );

          return NextResponse.json({
            success: true,
            payroll: result.payroll,
            earnings: result.earnings,
            deductions: result.deductions,
            message: 'Payroll generated successfully'
          });
        }

        case 'approve': {
          if (!employeeId || !organizationId || !periodStart || !periodEnd) {
            return NextResponse.json(
              { error: 'Missing required fields for approval' },
              { status: 400 }
            );
          }

          // Find the payroll record for this employee and period
          const payrolls = await payrollService.getByEmployeeId(employeeId);
          const payroll = payrolls.find(p =>
            p.periodStart.getTime() === new Date(periodStart).getTime() &&
            p.periodEnd.getTime() === new Date(periodEnd).getTime() &&
            p.status === 'COMPUTED'
          );

          if (!payroll) {
            return NextResponse.json(
              { error: 'No computed payroll found for approval' },
              { status: 404 }
            );
          }

          const result = await payrollService.approvePayroll(payroll.id, authRequest.user.id);

          return NextResponse.json({
            success: true,
            payroll: result,
            message: 'Payroll approved successfully'
          });
        }

        case 'release': {
          if (!employeeId || !organizationId || !periodStart || !periodEnd) {
            return NextResponse.json(
              { error: 'Missing required fields for release' },
              { status: 400 }
            );
          }

          // Find the payroll record for this employee and period
          const payrolls = await payrollService.getByEmployeeId(employeeId);
          const payroll = payrolls.find(p =>
            p.periodStart.getTime() === new Date(periodStart).getTime() &&
            p.periodEnd.getTime() === new Date(periodEnd).getTime() &&
            p.status === 'APPROVED'
          );

          if (!payroll) {
            return NextResponse.json(
              { error: 'No approved payroll found for release' },
              { status: 404 }
            );
          }

          const result = await payrollService.releasePayroll(payroll.id, authRequest.user.id);

          return NextResponse.json({
            success: true,
            payroll: result,
            message: 'Payroll released successfully'
          });
        }

        case 'void': {
          if (!employeeId || !organizationId || !periodStart || !periodEnd || !reason) {
            return NextResponse.json(
              { error: 'Missing required fields for void: reason required' },
              { status: 400 }
            );
          }

          // Find the payroll record for this employee and period
          const payrolls = await payrollService.getByEmployeeId(employeeId);
          const payroll = payrolls.find(p =>
            p.periodStart.getTime() === new Date(periodStart).getTime() &&
            p.periodEnd.getTime() === new Date(periodEnd).getTime() &&
            (p.status === 'APPROVED' || p.status === 'RELEASED')
          );

          if (!payroll) {
            return NextResponse.json(
              { error: 'No approved or released payroll found for voiding' },
              { status: 404 }
            );
          }

          const result = await payrollService.voidPayroll(payroll.id, authRequest.user.id, reason);

          return NextResponse.json({
            success: true,
            payroll: result,
            message: 'Payroll voided successfully'
          });
        }

        case 'process': {
          // Legacy support - redirect to generate
          if (!employeeId || !organizationId || !periodStart || !periodEnd) {
            return NextResponse.json(
              { error: 'Missing required fields: employeeId, organizationId, periodStart, periodEnd' },
              { status: 400 }
            );
          }

          const result = await payrollService.generatePayroll(
            {
              employeeId,
              organizationId,
              periodStart: new Date(periodStart),
              periodEnd: new Date(periodEnd),
            },
            authRequest.user.id
          );

          return NextResponse.json({
            success: true,
            payroll: result.payroll,
            earnings: result.earnings,
            deductions: result.deductions,
            message: 'Payroll processed successfully'
          });
        }

        default:
          return NextResponse.json(
            { error: 'Invalid action. Supported actions: generate, approve, release, void, process' },
            { status: 400 }
          );
      }

    } catch (error: any) {
      console.error('Payroll API error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
