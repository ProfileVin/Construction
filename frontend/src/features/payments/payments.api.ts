import { api } from '../../lib/api'

export type PaymentDirection = 'Inbound' | 'Outbound'
export type PaymentMethod = 'Ach' | 'Wire' | 'PayPal' | 'Check'
export type PaymentStatus = 'Processing' | 'Cleared'

export interface Payment {
  id: string
  projectId: string
  paymentNumber: string
  direction: PaymentDirection
  /** Client (inbound) or vendor (outbound). */
  partyName: string
  amount: number
  /** YYYY-MM-DD */
  paymentDate: string
  method: PaymentMethod
  status: PaymentStatus
  notes: string | null
  createdAt: string
}

export interface PagedPayments {
  items: Payment[]
  totalCount: number
  page: number
  pageSize: number
}

/** Cleared payments only (ADR-0028). */
export interface PaymentSummary {
  totalReceived: number
  totalDisbursed: number
}

export interface PaymentFilters {
  search?: string
  status?: PaymentStatus
  page: number
  pageSize: number
}

export interface CreatePaymentPayload {
  direction: PaymentDirection
  partyName: string
  amount: number
  /** YYYY-MM-DD */
  paymentDate: string
  method: PaymentMethod
  notes?: string
}

const base = (projectId: string) => `/projects/${projectId}/budget/payments`

export async function searchPayments(projectId: string, filters: PaymentFilters): Promise<PagedPayments> {
  const { data } = await api.get<PagedPayments>(base(projectId), { params: filters })
  return data
}

export async function getPaymentSummary(projectId: string): Promise<PaymentSummary> {
  const { data } = await api.get<PaymentSummary>(`${base(projectId)}/summary`)
  return data
}

export async function getPaymentPayees(projectId: string): Promise<string[]> {
  const { data } = await api.get<string[]>(`${base(projectId)}/payees`)
  return data
}

export async function createPayment(projectId: string, payload: CreatePaymentPayload): Promise<Payment> {
  const { data } = await api.post<Payment>(base(projectId), payload)
  return data
}

export async function markPaymentCleared(projectId: string, paymentId: string): Promise<Payment> {
  const { data } = await api.post<Payment>(`${base(projectId)}/${paymentId}/mark-cleared`)
  return data
}

export async function deletePayment(projectId: string, paymentId: string): Promise<void> {
  await api.delete(`${base(projectId)}/${paymentId}`)
}
