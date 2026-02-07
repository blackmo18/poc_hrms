import { z } from 'zod';

export const LeaveRequestSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  departmentId: z.string().optional(),
  leaveType: z.enum(['VACATION', 'SICK', 'EMERGENCY', 'BEREAVEMENT', 'UNPAID']),
  startDate: z.date(),
  endDate: z.date(),
  totalMinutes: z.number().int().optional(),
  isPaid: z.boolean().default(true),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).default('PENDING'),
  remarks: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const CreateLeaveRequestSchema = LeaveRequestSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateLeaveRequest = z.infer<typeof CreateLeaveRequestSchema>;

export const UpdateLeaveRequestSchema = CreateLeaveRequestSchema.partial();
export type UpdateLeaveRequest = z.infer<typeof UpdateLeaveRequestSchema>;
