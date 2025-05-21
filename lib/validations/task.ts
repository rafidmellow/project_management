import { z } from 'zod';

// Validation schema for creating a task
export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedTime: z.union([
    z.number().optional().nullable(),
    z
      .string()
      .optional()
      .nullable()
      .transform(val => {
        if (!val) return null;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }),
  ]),
  timeSpent: z.union([
    z.number().optional().nullable(),
    z
      .string()
      .optional()
      .nullable()
      .transform(val => {
        if (!val) return null;
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }),
  ]),
  projectId: z.string(),
  statusId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  parentId: z.string().optional().nullable(),
});

// Export the inferred type as well
export type CreateTaskValues = z.infer<typeof createTaskSchema>;

// You might want to add the updateTaskSchema here as well if it's used elsewhere
