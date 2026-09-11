import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Keep the name under 200 characters'),
  type: z.string().min(1, 'Choose a project type'),
  status: z.string().min(1, 'Choose a project status'),
  description: z.string().max(2000, 'Keep the description under 2000 characters').optional(),
})

export type CreateProjectValues = z.infer<typeof createProjectSchema>
