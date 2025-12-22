import { z } from 'zod';

export const LeaveRequestSchema = z.object({
  id: z.number().optional(),
  public_id: z.string(),
  employee_id: z.number().min(1, 'Employee ID is required'),
  leave_type: z.enum(['SICK', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE']),
  start_date: z.date(),
  end_date: z.date(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).default('PENDING'),
  remarks: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const CreateLeaveRequestSchema = LeaveRequestSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateLeaveRequest = z.infer<typeof CreateLeaveRequestSchema>;

export const UpdateLeaveRequestSchema = CreateLeaveRequestSchema.partial();
export type UpdateLeaveRequest = z.infer<typeof UpdateLeaveRequestSchema>;
