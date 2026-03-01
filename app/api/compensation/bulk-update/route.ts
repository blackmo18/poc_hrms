import { NextRequest, NextResponse } from 'next/server';
import { getCompensationService } from '@/lib/service/compensation.service';
import { UpdateCompensationSchema } from '@/lib/models/compensation';
import { requiresPermissions } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db';
import { generateULID } from '@/lib/utils/ulid.service';

const compensationService = getCompensationService();

export async function POST(request: NextRequest) {
  return requiresPermissions(request, ['compensation.update'], async (authRequest) => {
    try {
      const body = await request.json();
      const { updates, effectiveDate, reason } = body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return NextResponse.json(
          { error: 'Updates array is required' },
          { status: 400 }
        );
      }

      const user = authRequest.user!;
      const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');

      // Validate all updates and check permissions
      const validatedUpdates = [];
      for (const update of updates) {
        const validatedData = UpdateCompensationSchema.parse(update);
        
        // Get existing compensation to check organization access
        const existingCompensation = await compensationService.getById(update.id);
        if (!existingCompensation) {
          return NextResponse.json(
            { error: `Compensation with id ${update.id} not found` },
            { status: 404 }
          );
        }

        // Check organization access
        if (!isAdmin && existingCompensation.organizationId !== user.organizationId) {
          return NextResponse.json(
            { error: `Cannot update compensation with id ${update.id} from this organization` },
            { status: 403 }
          );
        }

        validatedUpdates.push({
          id: update.id,
          data: {
            ...validatedData,
            effectiveDate: effectiveDate ? new Date(effectiveDate) : validatedData.effectiveDate,
          }
        });
      }

      // Perform bulk update in a transaction
      const results = await prisma.$transaction(async (tx) => {
        const updatedCompensations = [];
        
        for (const { id, data } of validatedUpdates) {
          const updated = await tx.compensation.update({
            where: { id },
            data,
          });
          updatedCompensations.push(updated);
        }

        return updatedCompensations;
      });

      // Log the bulk update for audit purposes
      console.log(`Bulk compensation update by ${user.id}: ${updates.length} records updated`, {
        reason: reason || 'No reason provided',
        timestamp: new Date(),
      });

      return NextResponse.json({
        message: `Successfully updated ${results.length} compensation records`,
        updated: results,
      });
    } catch (error) {
      console.error('Error performing bulk compensation update:', error);
      return NextResponse.json(
        { error: 'Failed to perform bulk compensation update' },
        { status: 500 }
      );
    }
  });
}
