import { z } from 'zod'

export const taskStatusOptions = [
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Completed', value: 'Completed' },
] as const

export const createTaskSchema = z
  .object({
    title: z.string().min(1, 'Task title is required').max(200, 'Keep the title under 200 characters'),
    assigneeName: z
      .string()
      .min(1, 'Assignee is required')
      .max(200, 'Keep the assignee name under 200 characters'),
    assignedDate: z.date({ message: 'Assigned date is required' }),
    deadline: z.date({ message: 'Deadline is required' }),
    phaseId: z.string().nullable().optional(),
    status: z.enum(['Upcoming', 'InProgress', 'Completed']),
  })
  .refine((v) => v.deadline >= v.assignedDate, {
    message: 'Deadline must be on or after the assigned date',
    path: ['deadline'],
  })

export type CreateTaskValues = z.infer<typeof createTaskSchema>
