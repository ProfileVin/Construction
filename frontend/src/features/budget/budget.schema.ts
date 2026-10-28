import { z } from 'zod'

export const invoiceStatusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Paid', value: 'Paid' },
] as const

export const createInvoiceSchema = z.object({
  vendorName: z.string().min(1, 'Vendor is required').max(200, 'Keep the vendor name under 200 characters'),
  categoryId: z.string().nullable().optional(),
  amount: z.number({ message: 'Amount is required' }).gt(0, 'Amount must be greater than zero'),
  status: z.enum(['Pending', 'Paid']),
  issuedDate: z.date({ message: 'Issued date is required' }),
})

export type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>
