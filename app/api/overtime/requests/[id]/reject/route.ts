import { NextRequest, NextResponse } from 'next/server';
import { overtimeRequestService } from '@/lib/service/overtime-request.service';
import { requiresRoles } from '@/lib/auth/middleware';
import { ADMINSTRATIVE_ROLES } from '@/lib/constants/roles';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requiresRoles(request, ADMINSTRATIVE_ROLES, async (authRequest) => {
    try {
      const result = await overtimeRequestService.reject(id, authRequest.user.id);
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error rejecting overtime request:', error);

      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
      }

      if (error.message === 'Access denied') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      return NextResponse.json({ error: error.message || 'Failed to reject request' }, { status: 500 });
    }
  });
}
