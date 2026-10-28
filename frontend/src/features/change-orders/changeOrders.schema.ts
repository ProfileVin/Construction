import { z } from 'zod'
import { createTaskSchema } from '../dashboard/dashboard.schema'

// Mirrors ChangeOrderReasons.All on the API.
export const changeOrderReasons = [
  'Client Request',
  'Design Change',
  'Site Condition',
  'Code / Inspection Requirement',
  'Value Engineering',
  'Owner Upgrade',
  'Other',
] as const

// Mirrors CreateChangeOrderRequestValidator.MaxAttachments.
export const MAX_CHANGE_ORDER_ATTACHMENTS = 5

// Limits match CreateChangeOrderRequestValidator on the API.
export const createChangeOrderSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Keep the description under 500 characters'),
  reason: z.enum(changeOrderReasons, { message: 'Select a reason' }),
  scope: z.string().trim().max(2000, 'Keep the summary under 2000 characters').optional(),
  amount: z.number({ message: 'Estimated cost is required' }).gt(0, 'Must be above $0').max(1_000_000_000, 'Too large'),
  categoryId: z.string().nullable().optional(),
  scheduleImpactDays: z
    .number({ message: 'Enter the schedule impact' })
    .int('Whole days only')
    .min(0, 'Can’t be negative')
    .max(365, 'At most 365 days'),
  // Same per-file rules as task attachments / invoice receipts.
  attachments: z
    .array(createTaskSchema.shape.attachment.unwrap())
    .max(MAX_CHANGE_ORDER_ATTACHMENTS, `Attach at most ${MAX_CHANGE_ORDER_ATTACHMENTS} files`),
})

export type CreateChangeOrderValues = z.infer<typeof createChangeOrderSchema>

export const changeOrderStatusOptions = [
  { label: 'Pending GC Review', value: 'Pending' },
  { label: 'Pending Owner Approval', value: 'PendingOwnerApproval' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
]
