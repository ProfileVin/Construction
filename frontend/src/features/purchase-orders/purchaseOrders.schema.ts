import { z } from 'zod'

// Limits match CreatePurchaseOrderRequestValidator on the API.
export const purchaseOrderLineSchema = z.object({
  description: z.string().trim().min(1, 'Item is required').max(200, 'Keep the item under 200 characters'),
  quantity: z
    .number({ message: 'Required' })
    .int('Whole numbers only')
    .min(1, 'At least 1')
    .max(100_000, 'At most 100,000'),
  unitPrice: z.number({ message: 'Required' }).gt(0, 'Must be above $0').max(1_000_000_000, 'Too large'),
})

export const createPurchaseOrderSchema = z.object({
  vendorName: z.string().trim().min(1, 'Vendor is required').max(200, 'Keep the vendor under 200 characters'),
  lineItems: z.array(purchaseOrderLineSchema).min(1, 'Add at least one line item').max(50, 'At most 50 line items'),
  deliveryDate: z.date().optional(),
  notes: z.string().trim().max(2000, 'Keep the note under 2000 characters').optional(),
})

export type CreatePurchaseOrderValues = z.infer<typeof createPurchaseOrderSchema>

export const purchaseOrderStatusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Paid', value: 'Paid' },
]
