import { z } from 'zod'
import { createTaskSchema } from '../dashboard/dashboard.schema'

export const invoiceStatusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Scheduled', value: 'Scheduled' },
]

export const createInvoiceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Keep the title under 200 characters'),
  // Required by the dialog only when the project has categories (some have none yet).
  categoryId: z.string().optional(),
  amount: z.number({ message: 'Amount is required' }).gt(0, 'Amount must be greater than zero'),
  referenceNumber: z.string().trim().max(40, 'Keep the reference under 40 characters').optional(),
  billingDate: z.date({ message: 'Billing date is required' }),
  status: z.enum(['Pending', 'Paid', 'Scheduled']),
  notes: z.string().trim().max(2000, 'Keep the notes under 2000 characters').optional(),
  // Same size/type rules as task attachments (DocumentUploadRules on the API).
  receipt: createTaskSchema.shape.attachment,
})

export type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>
