import dayjs from 'dayjs'
import { z } from 'zod'
import { ALLOWED_EXTENSIONS, extensionOf } from '../documents/documents.schema'

export const taskStatusOptions = [
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Completed', value: 'Completed' },
] as const

// Mirrors DocumentUploadRules.TaskAttachmentMaxSizeBytes on the API.
export const MAX_TASK_ATTACHMENT_BYTES = 25 * 1024 * 1024

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task details are required')
    .max(1000, 'Keep the task details under 1000 characters'),
  assigneeName: z.string().min(1, 'Select an assignee'),
  deadline: z
    .date({ message: 'Select a deadline' })
    .refine((d) => !dayjs(d).isBefore(dayjs(), 'day'), 'Deadline can’t be in the past'),
  attachment: z
    .instanceof(File)
    .refine((f) => f.size > 0, 'The file is empty')
    .refine((f) => f.size <= MAX_TASK_ATTACHMENT_BYTES, 'Attachments must be 25 MB or smaller')
    .refine((f) => ALLOWED_EXTENSIONS.includes(extensionOf(f.name)), "This file type isn't supported")
    .optional(),
})

export type CreateTaskValues = z.infer<typeof createTaskSchema>

// Mirrors ActivityLogCategories.All on the API.
export const logCategoryOptions = ['Framing', 'Structural', 'Finishing', 'Electrical', 'Mechanical', 'Plumbing'] as const

export const createLogSchema = z.object({
  taskId: z.string().min(1, 'Select a milestone or task'),
  category: z.enum(logCategoryOptions, { message: 'Select a construction phase' }),
  assigneeName: createTaskSchema.shape.assigneeName,
  note: z.string().trim().min(1, 'A log note is required').max(2000, 'Keep the note under 2000 characters'),
  attachment: createTaskSchema.shape.attachment,
})

export type CreateLogValues = z.infer<typeof createLogSchema>

// No "not in the past" rule: overdue tasks must stay editable. The dialog's minDate is the assigned date.
export const editTaskSchema = z.object({
  title: createTaskSchema.shape.title,
  assigneeName: createTaskSchema.shape.assigneeName,
  deadline: z.date({ message: 'Select a deadline' }),
  phaseId: z.string().nullable(),
  status: z.enum(['Upcoming', 'InProgress', 'Completed']),
})

export type EditTaskValues = z.infer<typeof editTaskSchema>

// Mirrors DeadlineExtensionReasons.All on the API.
export const deadlineExtensionReasons = [
  'Weather Delay',
  'Material Shortage',
  'Labor Shortage',
  'Design Change',
  'Inspection Delay',
  'Permit Delay',
  'Other',
] as const

/** "After the current deadline" is checked against the task in the dialog (Calendar minDate) and by the API. */
export const extendDeadlineSchema = z.object({
  deadline: z.date({ message: 'Select a new deadline' }),
  reason: z.enum(deadlineExtensionReasons, { message: 'Select a reason for the extension' }),
})

export type ExtendDeadlineValues = z.infer<typeof extendDeadlineSchema>

export const logDescriptionSchema =z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Keep the description under 2000 characters'),
})

export type LogDescriptionValues = z.infer<typeof logDescriptionSchema>
