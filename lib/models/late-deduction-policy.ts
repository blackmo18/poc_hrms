import { z } from 'zod';
import { LatePolicyType, DeductionMethod } from '@prisma/client';

export const LateDeductionPolicySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Policy name is required'),
  policyType: z.nativeEnum(LatePolicyType, {
    message: 'Invalid policy type',
  }),
  deductionMethod: z.nativeEnum(DeductionMethod, {
    message: 'Invalid deduction method',
  }),
  fixedAmount: z.number().positive('Fixed amount must be positive').optional(),
  percentageRate: z.number().min(0, 'Percentage rate must be at least 0').max(100, 'Percentage rate cannot exceed 100').optional(),
  hourlyRateMultiplier: z.number().positive('Hourly rate multiplier must be positive').optional(),
  gracePeriodMinutes: z.number().min(0, 'Grace period cannot be negative').default(0),
  minimumLateMinutes: z.number().min(1, 'Minimum late minutes must be at least 1').default(1),
  maxDeductionPerDay: z.number().positive('Max deduction per day must be positive').optional(),
  maxDeductionPerCutoff: z.number().positive('Max deduction per cutoff must be positive').optional(),
  isActive: z.boolean().default(true),
  effectiveDate: z.date(),
  endDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => {
  // Validate deduction method has required fields
  switch (data.deductionMethod) {
    case 'FIXED_AMOUNT':
      return data.fixedAmount !== undefined && data.fixedAmount > 0;
    case 'PERCENTAGE':
      return data.percentageRate !== undefined && data.percentageRate > 0;
    case 'HOURLY_RATE':
      return data.hourlyRateMultiplier !== undefined && data.hourlyRateMultiplier > 0;
    default:
      return false;
  }
}, {
  message: 'Required fields missing for selected deduction method',
  path: ['deductionMethod'],
}).refine((data) => {
  // Validate date range
  if (data.endDate) {
    return data.effectiveDate < data.endDate;
  }
  return true;
}, {
  message: 'Effective date must be before end date',
  path: ['effectiveDate'],
});

export type LateDeductionPolicy = z.infer<typeof LateDeductionPolicySchema>;

export const CreateLateDeductionPolicySchema = LateDeductionPolicySchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateLateDeductionPolicy = z.infer<typeof CreateLateDeductionPolicySchema>;

export const UpdateLateDeductionPolicySchema = CreateLateDeductionPolicySchema.partial();
export type UpdateLateDeductionPolicy = z.infer<typeof UpdateLateDeductionPolicySchema>;
