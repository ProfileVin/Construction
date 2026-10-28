import { z } from 'zod'
import type { PaymentDirection, PaymentMethod } from './payments.api'

// Limits match CreatePaymentRequestValidator on the API.
export const createPaymentSchema = z.object({
  direction: z.enum(['Inbound', 'Outbound']),
  partyName: z.string().trim().min(1, 'Client/payee is required').max(200, 'Keep the name under 200 characters'),
  amount: z.number({ message: 'Amount is required' }).gt(0, 'Must be above $0').max(1_000_000_000, 'Too large'),
  paymentDate: z.date({ message: 'Payment date is required' }),
  method: z.enum(['Ach', 'Wire', 'PayPal', 'Check']),
  notes: z.string().trim().max(2000, 'Keep the note under 2000 characters').optional(),
})

export type CreatePaymentValues = z.infer<typeof createPaymentSchema>

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  Ach: 'Direct ACH',
  Wire: 'Wire',
  PayPal: 'PayPal',
  Check: 'Bank Check',
}

/** Table wording: inbound money is "Received", outbound is "Sent". */
export const DIRECTION_LABELS: Record<PaymentDirection, string> = {
  Inbound: 'Received',
  Outbound: 'Sent',
}

export const directionOptions = [
  { label: 'Inbound Payment (Client Payment)', value: 'Inbound' },
  { label: 'Outbound Payment (Vendor Disbursement)', value: 'Outbound' },
]

export const methodOptions = Object.entries(METHOD_LABELS).map(([value, label]) => ({ label, value }))

export const paymentStatusOptions = [
  { label: 'Processing', value: 'Processing' },
  { label: 'Cleared', value: 'Cleared' },
]
