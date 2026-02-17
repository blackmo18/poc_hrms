import { NextRequest, NextResponse } from 'next/server';
import { overtimeService, CreateOvertimeRequestData } from '@/lib/service/overtime.service';
import { prisma } from '@/lib/db';
import { Overtime, OvertimeRequestStatus } from '@prisma/client';
import { generateULID } from '@/lib/utils/ulid.service';
import { z } from 'zod';

const createOvertimeRequestSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  timeEntryId: z.string().optional(),
  timeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use 24-hour format HH:MM)').optional(),
  timeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use 24-hour format HH:MM)').optional(),
  reason: z.string().min(1, 'Reason is required'),
  otType: z.enum(['REGULAR_DAY', 'REST_DAY', 'EMERGENCY', 'SPECIAL_HOLIDAY', 'REGULAR_HOLIDAY']),
  remarks: z.string().optional(),
});

export class OvertimeController {
  // Prisma data access methods
  static async createOvertime(data: {
    id: string;
    employeeId: string;
    organizationId: string;
    workDate: Date;
    timeEntryId?: string | null;
    timeStart?: string | null;
    timeEnd?: string | null;
    otType: string;
    requestedMinutes: number;
    reason: string;
    remarks?: string | null;
    status: OvertimeRequestStatus;
  }) {
    return prisma.overtime.create({
      data: {
        id: data.id,
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        workDate: data.workDate,
        timeEntryId: data.timeEntryId,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        otType: data.otType as any,
        requestedMinutes: data.requestedMinutes,
        reason: data.reason,
        remarks: data.remarks,
        status: data.status,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async findOvertimeById(id: string) {
    return prisma.overtime.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  static async getOvertimeRequestsByOrganizationAndPeriod(
    organizationId: string,
    departmentId: string | undefined,
    periodStart: Date,
    periodEnd: Date
  ) {
    const whereClause: any = {
      employee: {
        organizationId,
        ...(departmentId && { departmentId }),
      },
      workDate: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    return await prisma.overtime.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        workDate: true,
      },
      orderBy: { workDate: 'desc' },
    });
  }

  static async validateTimeEntryOwnership(timeEntryId: string, employeeId: string) {
    return prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        employeeId,
      },
    });
  }

  // HTTP methods
  async createOvertimeRequest(request: NextRequest, employeeId: string, organizationId: string) {
    try {
      const body = await request.json();
      const validatedData = createOvertimeRequestSchema.parse(body);

      const overtimeData: CreateOvertimeRequestData = {
        employeeId,
        organizationId,
        workDate: new Date(validatedData.workDate),
        timeEntryId: validatedData.timeEntryId || null,
        timeStart: validatedData.timeStart || null,
        timeEnd: validatedData.timeEnd || null,
        reason: validatedData.reason,
        otType: validatedData.otType,
        remarks: validatedData.remarks || null,
      };

      const overtimeRequest = await overtimeService.createOvertimeRequest(overtimeData);

      return NextResponse.json({
        success: true,
        data: overtimeRequest,
      });
    } catch (error) {
      console.error('Error creating overtime request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Time entry not found or does not belong to user') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async getOvertimeRequests(employeeId: string) {
    try {
      const overtimeRequests = await overtimeService.getOvertimeRequestsByEmployee(employeeId);

      return NextResponse.json({
        success: true,
        data: overtimeRequests,
      });
    } catch (error) {
      console.error('Error fetching overtime requests:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  async getOvertimeRequestById(id: string) {
    try {
      const overtimeRequest = await overtimeService.getOvertimeRequestById(id);

      if (!overtimeRequest) {
        return NextResponse.json(
          { error: 'Overtime request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: overtimeRequest,
      });
    } catch (error) {
      console.error('Error fetching overtime request:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
}

export const overtimeController = new OvertimeController();
