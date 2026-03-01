import { NextRequest, NextResponse } from 'next/server';
import { HolidayTemplateService } from '@/lib/service/holiday-template.service';
import { requiresRoles } from '@/lib/auth/middleware';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

const holidayTemplateService = new HolidayTemplateService();

export async function POST(request: NextRequest) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const body = await authRequest.json();
      const { organizationId, sourceTemplateId, newTemplateName, targetYear } = body;

      if (!organizationId || !sourceTemplateId || !newTemplateName) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Organization ID, source template ID, and new template name are required' 
          },
          { status: 400 }
        );
      }

      // Copy the template
      const result = await holidayTemplateService.copyTemplate({
        organizationId,
        sourceTemplateId,
        newTemplateName,
        targetYear: targetYear ? parseInt(targetYear) : undefined
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: `Successfully copied template with ${result.totalCopied} holidays`
      });
    } catch (error) {
      console.error('Error copying holiday template:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to copy holiday template' 
        },
        { status: 500 }
      );
    }
  });
}
