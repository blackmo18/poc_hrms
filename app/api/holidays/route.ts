import { NextRequest, NextResponse } from 'next/server';
import { requiresRoles } from '@/lib/auth/middleware';
import { holidayService } from '@/lib/service/holiday.service';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      // Get organization ID from query params or user session
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId') || authRequest.user?.organizationId;

      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
      }

      // Get year from query params, default to current year
      const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
      
      // Check if template information should be included
      const includeTemplate = searchParams.get('includeTemplate') === 'true';

      // Create date range for the year
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31); // December 31st

      const holidays = await holidayService.getHolidays(organizationId, startDate, endDate, includeTemplate);

      // Transform the data for the frontend
      const transformedHolidays = holidays.map(holiday => ({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        type: holiday.type,
        rateMultiplier: holiday.rateMultiplier,
        isPaidIfNotWorked: holiday.isPaidIfNotWorked,
        countsTowardOt: holiday.countsTowardOt,
        ...(includeTemplate && holiday.holidayTemplate && {
          holidayTemplate: {
            id: holiday.holidayTemplate.id,
            name: holiday.holidayTemplate.name,
            isDefault: holiday.holidayTemplate.isDefault,
            organization: holiday.holidayTemplate.organization ? {
              name: holiday.holidayTemplate.organization.name
            } : undefined
          }
        })
      }));

      return NextResponse.json({
        success: true,
        data: transformedHolidays,
      });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
