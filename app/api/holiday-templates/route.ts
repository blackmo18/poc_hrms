import { NextRequest, NextResponse } from 'next/server';
import { HolidayTemplateService } from '@/lib/service/holiday-template.service';
import { requiresRoles } from '@/lib/auth/middleware';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

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
        for (const holiday of holidays) {
          if (!holiday.name || !holiday.date || !holiday.type) {
            return NextResponse.json(
              { success: false, error: 'Each holiday must have name, date, and type' },
              { status: 400 }
            );
          }
        }
      }

      // Create new holiday template with holidays
      const template = await holidayTemplateService.createTemplate({
        name,
        description,
        organizationId,
        holidays,
      });

      return NextResponse.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Error creating holiday template:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create holiday template' },
        { status: 500 }
      );
    }
  });
}
