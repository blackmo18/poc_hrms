import { z } from 'zod';

const sssPattern = /^\d{2}-\d{7}-\d{1}$/;
const philhealthPattern = /^\d{2}-\d{9}-\d{1}$/;
const pagibigPattern = /^\d{4}-\d{4}-\d{4}$/;
const tinPattern = /^\d{3}-\d{3}-\d{3}-\d{3}$/;

export const EmployeeGovernmentInfoSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  sssNumber: z.string().regex(sssPattern, 'SSS number must be in format: XX-XXXXXXXX-X').optional().or(z.literal('')),
  philhealthNumber: z.string().regex(philhealthPattern, 'Philhealth number must be in format: XX-XXXXXXXXXX-X').optional().or(z.literal('')),
  pagibigNumber: z.string().regex(pagibigPattern, 'Pagibig number must be in format: XXXX-XXXX-XXXX').optional().or(z.literal('')),
  tinNumber: z.string().regex(tinPattern, 'TIN must be in format: XXX-XXX-XXX-XXX').optional().or(z.literal('')),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine((data) => {
  // At least one government number should be provided
  return !!(data.sssNumber || data.philhealthNumber || data.pagibigNumber || data.tinNumber);
}, {
  message: 'At least one government number must be provided',
});

export type EmployeeGovernmentInfo = z.infer<typeof EmployeeGovernmentInfoSchema>;

export const CreateEmployeeGovernmentInfoSchema = EmployeeGovernmentInfoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateEmployeeGovernmentInfo = z.infer<typeof CreateEmployeeGovernmentInfoSchema>;

export const UpdateEmployeeGovernmentInfoSchema = CreateEmployeeGovernmentInfoSchema.partial().omit({
  employeeId: true,
  organizationId: true,
});

export type UpdateEmployeeGovernmentInfo = z.infer<typeof UpdateEmployeeGovernmentInfoSchema>;

export const BulkUpdateEmployeeGovernmentInfoSchema = z.array(z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  sssNumber: z.string().regex(sssPattern).optional().or(z.literal('')),
  philhealthNumber: z.string().regex(philhealthPattern).optional().or(z.literal('')),
  pagibigNumber: z.string().regex(pagibigPattern).optional().or(z.literal('')),
  tinNumber: z.string().regex(tinPattern).optional().or(z.literal('')),
})).min(1, 'At least one employee update is required');

export type BulkUpdateEmployeeGovernmentInfo = z.infer<typeof BulkUpdateEmployeeGovernmentInfoSchema>;

export const GovernmentNumberValidationSchema = z.object({
  sssNumber: z.string().regex(sssPattern).optional().or(z.literal('')),
  philhealthNumber: z.string().regex(philhealthPattern).optional().or(z.literal('')),
  pagibigNumber: z.string().regex(pagibigPattern).optional().or(z.literal('')),
  tinNumber: z.string().regex(tinPattern).optional().or(z.literal('')),
});

export type GovernmentNumberValidation = z.infer<typeof GovernmentNumberValidationSchema>;

export const GovernmentNumberSearchSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  searchType: z.enum(['sss', 'philhealth', 'pagibig', 'tin']),
  number: z.string().min(1, 'Search number is required'),
});

export type GovernmentNumberSearch = z.infer<typeof GovernmentNumberSearchSchema>;

export const GovernmentInfoComplianceSchema = z.object({
  totalEmployees: z.number(),
  employeesWithInfo: z.number(),
  employeesWithoutInfo: z.number(),
  complianceRate: z.number(),
  completeInfo: z.number(),
  partialInfo: z.number(),
  missingInfo: z.number(),
});

export type GovernmentInfoCompliance = z.infer<typeof GovernmentInfoComplianceSchema>;
