import { z } from 'zod';

export const JobTitleSchema = z.object({
  id: z.string().optional(),
  organization_id: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Job title name is required'),
  description: z.string().optional(),
});

export type JobTitle = z.infer<typeof JobTitleSchema>;

export const CreateJobTitleSchema = JobTitleSchema.omit({ id: true });
export type CreateJobTitle = z.infer<typeof CreateJobTitleSchema>;

export const UpdateJobTitleSchema = CreateJobTitleSchema.partial();
export type UpdateJobTitle = z.infer<typeof UpdateJobTitleSchema>;
