import { NextRequest, NextResponse } from 'next/server';
import { requiresRoles } from '@/lib/auth/middleware';
import { holidayService } from '@/lib/service/holiday.service';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

interface CopyFromTemplateRequest {
  sourceTemplateId: string;
  newTemplateName: string;
  targetYear?: number;
}

export async function POST(request: NextRequest) {
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const body: CopyFromTemplateRequest = await request.json();
      const { sourceTemplateId, newTemplateName, targetYear } = body;

      // Validate required fields
      if (!sourceTemplateId || !newTemplateName) {
        return NextResponse.json(
          { error: 'sourceTemplateId and newTemplateName are required' },
          { status: 400 }
        );
      }

      // Validate targetYear if provided
      if (targetYear && (targetYear < 2020 || targetYear > 2050)) {
        return NextResponse.json(
          { error: 'targetYear must be between 2020 and 2050' },
          { status: 400 }
        );
      }

      const organizationId = authRequest.user?.organizationId;
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID not found in session' },
          { status: 400 }
        );
      }

      // Use the service layer to copy holidays from template
      const result = await holidayService.copyHolidaysFromTemplate({
        organizationId,
        sourceTemplateId,
        newTemplateName,
        targetYear
      });

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error copying holidays from template:', error);
      
      // Handle specific service errors
      if (error instanceof Error) {
        if (error.message === 'Source template not found') {
          return NextResponse.json(
            { error: 'Source template not found' },
            { status: 404 }
          );
        }
        if (error.message === 'A template with this name already exists for your organization') {
          return NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
