import { z } from 'zod';

// OvertimeRequestStatus enum
export const OvertimeRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type OvertimeRequestStatusType = typeof OvertimeRequestStatus[keyof typeof OvertimeRequestStatus];

// OvertimeRequest create schema
export const CreateOvertimeRequestSchema = z.object({
  employee_id: z.string(),
  organization_id: z.string(),
  work_date: z.date(),
  requested_minutes: z.number().int().min(1).max(1440), // Max 24 hours
  reason: z.string().optional(),
});

export type CreateOvertimeRequest = z.infer<typeof CreateOvertimeRequestSchema>;

// OvertimeRequest update schema
export const UpdateOvertimeRequestSchema = z.object({
  approved_minutes: z.number().int().min(0).optional(),
  status: z.enum([OvertimeRequestStatus.PENDING, OvertimeRequestStatus.APPROVED, OvertimeRequestStatus.REJECTED, OvertimeRequestStatus.CANCELLED]).optional(),
  reason: z.string().optional(),
  approved_by_user_id: z.string().optional(),
  approved_at: z.date().optional(),
  updated_by: z.string().optional(),
});

export type UpdateOvertimeRequest = z.infer<typeof UpdateOvertimeRequestSchema>;

// OvertimeRequest filters
export const OvertimeRequestFiltersSchema = z.object({
  employee_id: z.string().optional(),
  organization_id: z.string().optional(),
  status: z.enum([OvertimeRequestStatus.PENDING, OvertimeRequestStatus.APPROVED, OvertimeRequestStatus.REJECTED, OvertimeRequestStatus.CANCELLED]).optional(),
  work_date: z.date().optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional(),
  approved_by_user_id: z.string().optional(),
});

export type OvertimeRequestFilters = z.infer<typeof OvertimeRequestFiltersSchema>;

// OvertimeRequest with relations type
export type OvertimeRequestWithRelations = {
  id: string;
  employee_id: string;
  organization_id: string;
  work_date: Date;
  requested_minutes: number;
  approved_minutes: number | null;
  status: OvertimeRequestStatusType;
  reason: string | null;
  requested_at: Date;
  approved_at: Date | null;
  approved_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: {
      id: string;
      name: string;
    };
    jobTitle: {
      id: string;
      name: string;
    };
  };
  organization: {
    id: string;
    name: string;
  };
  approver?: {
    id: string;
    email: string;
  };
};
