import { z } from 'zod'

export const phaseStatusOptions = [
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Completed', value: 'Completed' },
] as const

export const createPhaseSchema = z
  .object({
    name: z.string().min(1, 'Phase name is required').max(200, 'Keep the name under 200 characters'),
    startDate: z.date({ message: 'Start date is required' }),
    endDate: z.date({ message: 'End date is required' }),
    percentComplete: z
      .number({ message: 'Percent complete is required' })
      .min(0, 'Must be at least 0')
      .max(100, 'Must be at most 100'),
    status: z.enum(['Upcoming', 'InProgress', 'Completed']),
    checkpointLabel: z.string().max(300, 'Keep the label under 300 characters').optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })

export type CreatePhaseValues = z.infer<typeof createPhaseSchema>
