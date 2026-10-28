import dayjs from 'dayjs'
import { z } from 'zod'
import type { PhaseStatus } from './schedule.api'

// Standard construction phases offered by "Assign New Milestone"; the pick becomes the roadmap
// row heading (`ConstructionPhase.name`). Includes the seeded demo names so they read alike.
export const constructionPhaseOptions = [
  'Site Preparation',
  'Foundation & Excavation',
  'Ground Floor Framing',
  'Upper Floor Framing',
  'Roofing',
  'Electrical & Conduit Rough-in',
  'Plumbing & HVAC Installation',
  'Drywall & Insulation',
  'Exterior Envelope',
  'Interior Finishes',
  'Final Inspection & Handover',
].map((name) => ({ label: name, value: name }))

export const createPhaseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Milestone title is required')
      .max(300, 'Keep the title under 300 characters'),
    phase: z.string().min(1, 'Select a phase').max(200, 'Keep the phase under 200 characters'),
    startDate: z.date({ message: 'Start date is required' }),
    endDate: z.date({ message: 'Completion date is required' }),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'Completion date must be on or after the start date',
    path: ['endDate'],
  })

export type CreatePhaseValues = z.infer<typeof createPhaseSchema>

/** A new milestone's status follows its dates: past → Completed (100%), spanning today → In Progress, else Upcoming. */
export function derivePhaseStatus(
  start: Date,
  end: Date,
  today: Date = new Date(),
): { status: PhaseStatus; percentComplete: number } {
  const day = dayjs(today).startOf('day')
  if (dayjs(end).startOf('day').isBefore(day)) return { status: 'Completed', percentComplete: 100 }
  if (!dayjs(start).startOf('day').isAfter(day)) return { status: 'InProgress', percentComplete: 0 }
  return { status: 'Upcoming', percentComplete: 0 }
}
