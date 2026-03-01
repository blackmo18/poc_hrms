import { z } from 'zod';

const validDeductionTypes = [
  'TAX', 'SSS', 'PHILHEALTH', 'PAGIBIG',
  'LATE', 'UNDERTIME', 'ABSENCE',
  'LOAN', 'ADVANCE', 'OTHER'
];

export const DeductionSchema = z.object({
  id: z.string().optional(),
  payrollId: z.string().min(1, 'Payroll ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  type: z.enum(validDeductionTypes, {
    message: 'Invalid deduction type',
  }),
  amount: z.number().positive('Amount must be positive'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Deduction = z.infer<typeof DeductionSchema>;

export const CreateDeductionSchema = DeductionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDeduction = z.infer<typeof CreateDeductionSchema>;

export const UpdateDeductionSchema = CreateDeductionSchema.partial().omit({
  payrollId: true,
  organizationId: true,
  employeeId: true,
});

export type UpdateDeduction = z.infer<typeof UpdateDeductionSchema>;

export const BulkCreateDeductionsSchema = z.array(CreateDeductionSchema).min(1, 'At least one deduction is required');

export type BulkCreateDeductions = z.infer<typeof BulkCreateDeductionsSchema>;

export const DeductionSummarySchema = z.object({
  type: z.string(),
  total: z.number(),
  count: z.number().optional(),
});

export type DeductionSummary = z.infer<typeof DeductionSummarySchema>;

export const DeductionFilterSchema = z.object({
  organizationId: z.string().optional(),
  payrollId: z.string().optional(),
  employeeId: z.string().optional(),
  type: z.enum(validDeductionTypes as [string, ...string[]]).optional(),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
}).refine((data) => {
  if (data.periodStart && data.periodEnd) {
    return data.periodStart < data.periodEnd;
  }
  return true;
}, {
  message: 'Period start must be before period end',
  path: ['periodStart'],
});

export type DeductionFilter = z.infer<typeof DeductionFilterSchema>;
