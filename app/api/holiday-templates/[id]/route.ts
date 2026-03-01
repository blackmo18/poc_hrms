import { NextRequest, NextResponse } from 'next/server';
import { HolidayTemplateService } from '@/lib/service/holiday-template.service';
import { requiresRoles } from '@/lib/auth/middleware';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

const holidayTemplateService = new HolidayTemplateService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const { id: templateId } = await params;

      if (!templateId) {
        return NextResponse.json(
          { success: false, error: 'Template ID is required' },
          { status: 400 }
        );
      }

      await holidayTemplateService.deleteTemplate(templateId);

      return NextResponse.json({
        success: true,
        message: 'Holiday template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting holiday template:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete holiday template' 
        },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const { id: templateId } = await params;
      const body = await authRequest.json();
      const { name, description, holidays } = body;

      if (!templateId) {
        return NextResponse.json(
          { success: false, error: 'Template ID is required' },
          { status: 400 }
        );
      }

      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Template name is required' },
          { status: 400 }
        );
      }

      // Update template
      const result = await holidayTemplateService.updateTemplate(templateId, {
        name,
        description,
        holidays
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Holiday template updated successfully'
      });
    } catch (error) {
      console.error('Error updating holiday template:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to update holiday template' 
        },
        { status: 500 }
      );
    }
  });
}
