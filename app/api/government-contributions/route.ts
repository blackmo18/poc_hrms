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

export async function GET(request: NextRequest) {
  return requiresPermissions(request, ['payroll.read'], async (authRequest) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // tax, philhealth, sss, pagibig
    const date = searchParams.get('date');
    const organizationId = searchParams.get('organizationId');
    const salary = searchParams.get('salary');
    const calculate = searchParams.get('calculate'); // deductions, tax, rates

    const user = authRequest.user!;
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isAdmin = user.roles.includes('ADMIN');
    const isHRManager = user.roles.includes('HR_MANAGER');

    // Determine organization ID
    let targetOrganizationId = organizationId;
    if (!isSuperAdmin && !isAdmin && !isHRManager) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    if (!isSuperAdmin && !targetOrganizationId) {
      targetOrganizationId = user.organizationId;
    }

    try {
      // Handle different GET operations
      if (calculate === 'deductions' && salary) {
        const result = await governmentContributionController.calculateDeductions(
          targetOrganizationId!,
          parseFloat(salary),
          date ? new Date(date) : undefined
        );
        return NextResponse.json(result);
      }

      if (calculate === 'tax' && salary) {
        const result = await governmentContributionController.calculateTax(
          targetOrganizationId!,
          parseFloat(salary),
          date ? new Date(date) : undefined
        );
        return NextResponse.json({ tax: result });
      }

      if (calculate === 'rates' && salary) {
        const result = await governmentContributionController.getContributionRates(
          targetOrganizationId!,
          parseFloat(salary),
          date ? new Date(date) : undefined
        );
        return NextResponse.json(result);
      }

      // Get rates by type
      switch (type) {
        case 'tax':
          const taxBrackets = await governmentContributionController.getTaxBrackets(
            targetOrganizationId!,
            date ? new Date(date) : undefined
          );
          return NextResponse.json(taxBrackets);

        case 'philhealth':
          const philhealthRates = await governmentContributionController.getPhilhealthRates(
            targetOrganizationId!,
            date ? new Date(date) : undefined
          );
          return NextResponse.json(philhealthRates);

        case 'sss':
          const sssRates = await governmentContributionController.getSSSRates(
            targetOrganizationId!,
            date ? new Date(date) : undefined
          );
          return NextResponse.json(sssRates);

        case 'pagibig':
          const pagibigRates = await governmentContributionController.getPagibigRates(
            targetOrganizationId!,
            date ? new Date(date) : undefined
          );
          return NextResponse.json(pagibigRates);

        default:
          return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
      }
    } catch (error: any) {
      console.error('Error in government contributions GET:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch government contributions' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['payroll.manage'], async (authRequest) => {
    try {
      const body = await request.json();
      const { type, organizationId, ...data } = body;

      const user = authRequest.user!;
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isAdmin = user.roles.includes('ADMIN');
      const isHRManager = user.roles.includes('HR_MANAGER');

      // Determine organization ID
      let targetOrganizationId = organizationId;
      if (!isSuperAdmin && !isAdmin && !isHRManager) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (!isSuperAdmin && !targetOrganizationId) {
        targetOrganizationId = user.organizationId;
      }

      // Validate organization access
      if (!isSuperAdmin && targetOrganizationId !== user.organizationId) {
        return NextResponse.json({ error: 'Cannot manage contributions for this organization' }, { status: 403 });
      }

      let result;

      switch (type) {
        case 'tax':
          result = await governmentContributionController.createTaxBracket(targetOrganizationId!, data);
          break;

        case 'philhealth':
          result = await governmentContributionController.createPhilhealthRate(targetOrganizationId!, data);
          break;

        case 'sss':
          result = await governmentContributionController.createSSSRate(targetOrganizationId!, data);
          break;

        case 'pagibig':
          result = await governmentContributionController.createPagibigRate(targetOrganizationId!, data);
          break;

        case 'calculate-bonus-tax':
          result = await governmentContributionController.calculateBonusTax(
            targetOrganizationId!,
            data.bonusAmount,
            data.otherIncome
          );
          break;

        case 'compute-withholding-tax':
          result = await governmentContributionController.computeWithholdingTax(
            targetOrganizationId!,
            data.grossSalary,
            data.governmentDeductions,
            data.date ? new Date(data.date) : undefined
          );
          break;

        default:
          return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
      }

      return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
      console.error('Error in government contributions POST:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create government contribution' },
        { status: 500 }
      );
    }
  });
}
