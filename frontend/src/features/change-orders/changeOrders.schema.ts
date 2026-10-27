import { z } from 'zod'

// Limits match CreateChangeOrderRequestValidator on the API.
export const createChangeOrderSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Keep the description under 500 characters'),
  amount: z.number({ message: 'Amount is required' }).gt(0, 'Must be above $0').max(1_000_000_000, 'Too large'),
  requestedDate: z.date({ message: 'Date is required' }),
  reason: z.string().trim().max(2000, 'Keep the reason under 2000 characters').optional(),
})

export type CreateChangeOrderValues = z.infer<typeof createChangeOrderSchema>

export const changeOrderStatusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
]
