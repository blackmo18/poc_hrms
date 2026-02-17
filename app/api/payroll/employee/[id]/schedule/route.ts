import { NextRequest, NextResponse } from 'next/server';
import { requiresAdmin, requiresPermissions } from '@/lib/auth/middleware';
import { getWorkScheduleService } from '@/lib/service/work-schedule.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresAdmin(request, async (authRequest) => {
    try {
      const { id: employeeId } = await params;
      
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId');

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      // Check user permissions for the organization
      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Super Admin can access any organization
      // Admin and HR Manager can only access their own organization
      if (!isSuperAdmin && !isAdmin && (!isHRManager || organizationId !== user.organizationId)) {
        return NextResponse.json(
          { error: 'Cannot access data for this organization' },
          { status: 403 }
        );
      }

      const workScheduleService = getWorkScheduleService();
      const workSchedule = await workScheduleService.getByEmployeeId(employeeId);

      if (!workSchedule) {
        return NextResponse.json(
          { error: 'Work schedule not found for this employee' },
          { status: 404 }
        );
      }

      // Transform the data to match the expected format
      const transformedSchedule = {
        monday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('MONDAY') || false },
        tuesday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('TUESDAY') || false },
        wednesday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('WEDNESDAY') || false },
        thursday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('THURSDAY') || false },
        friday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('FRIDAY') || false },
        saturday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('SATURDAY') || false },
        sunday: { start: workSchedule.defaultStart || '09:00', end: workSchedule.defaultEnd || '18:00', isEnabled: workSchedule.workDays?.includes('SUNDAY') || false },
        nightShiftStart: workSchedule.nightShiftStart || '',
        nightShiftEnd: workSchedule.nightShiftEnd || '',
      };

      return NextResponse.json(transformedSchedule);
    } catch (error) {
      console.error('Error fetching work schedule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch work schedule' },
        { status: 500 }
      );
    }
  });
}
