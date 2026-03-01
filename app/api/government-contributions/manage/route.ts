import { NextRequest, NextResponse } from 'next/server';
import { GovernmentContributionController } from '@/lib/controllers/government-contribution.controller';
import { requiresPermissions } from '@/lib/auth/middleware';
import { DIContainer } from '@/lib/di/container';
import { prisma } from '@/lib/db';
import { TaxBracketPrismaController } from '@/lib/controllers/prisma/tax-bracket.prisma.controller';
import { PhilhealthPrismaController } from '@/lib/controllers/prisma/philhealth.prisma.controller';
import { SSSPrismaController } from '@/lib/controllers/prisma/sss.prisma.controller';
import { PagibigPrismaController } from '@/lib/controllers/prisma/pagibig.prisma.controller';

const diContainer = DIContainer.getInstance();
const governmentContributionController = new GovernmentContributionController(
  new TaxBracketPrismaController(prisma),
  new PhilhealthPrismaController(prisma),
  new SSSPrismaController(prisma),
  new PagibigPrismaController(prisma)
);

export async function PUT(request: NextRequest) {
  return requiresPermissions(request, ['payroll.manage'], async (authRequest) => {
    try {
      const body = await request.json();
      const { type, id, organizationId, ...data } = body;

      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');

      // Validate organization access
      if (!isSuperAdmin && organizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Cannot update contributions for this organization' }, { status: 403 });
      }

      let result;

      switch (type) {
        case 'tax':
          result = await governmentContributionController.updateTaxBracket(id, organizationId, data);
          break;

        case 'philhealth':
          result = await governmentContributionController.updatePhilhealthRate(id, organizationId, data);
          break;

        case 'sss':
          result = await governmentContributionController.updateSSSRate(id, organizationId, data);
          break;

        case 'pagibig':
          result = await governmentContributionController.updatePagibigRate(id, organizationId, data);
          break;

        default:
          return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
      }

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error in government contributions PUT:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update government contribution' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return requiresPermissions(request, ['payroll.manage'], async (authRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');
      const id = searchParams.get('id');
      const organizationId = searchParams.get('organizationId');

      if (!type || !id || !organizationId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }

      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');

      // Validate organization access
      if (!isSuperAdmin && organizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Cannot delete contributions for this organization' }, { status: 403 });
      }

      let result;

      switch (type) {
        case 'tax':
          result = await governmentContributionController.deleteTaxBracket(id, organizationId);
          break;

        case 'philhealth':
          result = await governmentContributionController.deletePhilhealthRate(id, organizationId);
          break;

        case 'sss':
          result = await governmentContributionController.deleteSSSRate(id, organizationId);
          break;

        case 'pagibig':
          result = await governmentContributionController.deletePagibigRate(id, organizationId);
          break;

        default:
          return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
      }

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error in government contributions DELETE:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete government contribution' },
        { status: 500 }
      );
    }
  });
}
