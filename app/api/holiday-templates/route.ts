import { NextRequest, NextResponse } from 'next/server';
import { HolidayTemplateService } from '@/lib/service/holiday-template.service';
import { requiresRoles } from '@/lib/auth/middleware';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';
import { ensureUTCForStorage } from '@/lib/utils/timezone-utils';
import { z } from 'zod';

const holidayTemplateService = new HolidayTemplateService();

export async function GET(request: NextRequest) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const { searchParams } = new URL(authRequest.url);
      const organizationId = searchParams.get('organizationId');

      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'Organization ID is required' },
          { status: 400 }
        );
      }

      // Get organization-specific templates and system templates
      const templates = await holidayTemplateService.getTemplatesByOrganization(organizationId);

      return NextResponse.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      console.error('Error fetching holiday templates:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch holiday templates' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const body = await authRequest.json();
      const { name, description, organizationId, holidays } = body;

      if (!name || !organizationId) {
        return NextResponse.json(
          { success: false, error: 'Name and organization ID are required' },
          { status: 400 }
        );
      }

      // Validate holidays if provided
      if (holidays) {
        const holidaySchema = z.object({
          name: z.string().min(1, 'Holiday name is required'),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/, 'Invalid date format (use ISO format with timezone)'),
          type: z.enum(['REGULAR', 'SPECIAL', 'SPECIAL_NON_WORKING', 'COMPANY', 'LGU']),
          isPaidIfNotWorked: z.boolean().optional(),
          countsTowardOt: z.boolean().optional(),
          rateMultiplier: z.number().optional(),
        });

        for (const holiday of holidays) {
          try {
            holidaySchema.parse(holiday);
          } catch (error) {
            return NextResponse.json(
              { success: false, error: `Invalid holiday data: ${error.message}` },
              { status: 400 }
            );
          }
        }

        // Convert holiday dates to UTC
        const holidaysWithUTC = holidays.map(holiday => ({
          ...holiday,
          date: ensureUTCForStorage(holiday.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD for controller
        }));

        console.log('Holiday Template API - Converting holiday dates:', {
          holidays: holidays.map(h => ({ name: h.name, original: h.date })),
          converted: holidaysWithUTC.map(h => ({ name: h.name, converted: h.date }))
        });

        // Create new holiday template with holidays
        const template = await holidayTemplateService.createTemplate({
          name,
          description,
          organizationId,
          holidays: holidaysWithUTC,
        });

        return NextResponse.json({
          success: true,
          data: template,
        });
      } else {
        // Create template without holidays
        const template = await holidayTemplateService.createTemplate({
          name,
          description,
          organizationId,
        });

        return NextResponse.json({
          success: true,
          data: template,
        });
      }
    } catch (error) {
      console.error('Error creating holiday template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create holiday template' },
        { status: 500 }
      );
    }
  });
}
