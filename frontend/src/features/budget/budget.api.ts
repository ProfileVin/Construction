import { api } from '../../lib/api'

export type InvoiceStatus = 'Pending' | 'Paid' | 'Scheduled'

export interface BudgetCategory {
  id: string
  projectId: string
  name: string
  allocatedAmount: number
  spentAmount: number
  isContingency: boolean
  createdAt: string
}

export interface Invoice {
  id: string
  projectId: string
  invoiceNumber: string
  vendorName: string
  categoryId: string | null
  categoryName: string | null
  amount: number
  status: InvoiceStatus
  issuedDate: string
  createdAt: string
  notes: string | null
  /** The receipt / supporting voucher, stored as a project document. */
  receiptDocumentId: string | null
}

export interface BudgetSummary {
  categories: BudgetCategory[]
  totalAllocated: number
  totalActualSpent: number
  remainingBalance: number
  committedPOs: number
  unbilledWork: number
  contingencyBurnPercent: number | null
  contingencyStatusLabel: string | null
}

export interface PagedInvoices {
  items: Invoice[]
  totalCount: number
  page: number
  pageSize: number
}

export interface CreateInvoicePayload {
  /** The "Expense / Invoice Title" — shown under the invoice number. */
  vendorName: string
  categoryId: string | null
  amount: number
  status: InvoiceStatus
  /** YYYY-MM-DD */
  issuedDate: string
  /** Replaces the generated INV-{year}-{seq} number when given. */
  referenceNumber?: string
  notes?: string
  receipt?: File
}

export async function getBudgetSummary(projectId: string): Promise<BudgetSummary> {
  const { data } = await api.get<BudgetSummary>(`/projects/${projectId}/budget/summary`)
  return data
}

export async function searchInvoices(
  projectId: string,
  params: { page: number; pageSize: number },
): Promise<PagedInvoices> {
  const { data } = await api.get<PagedInvoices>(`/projects/${projectId}/budget/invoices`, { params })
  return data
}

export async function createInvoice(projectId: string, payload: CreateInvoicePayload): Promise<Invoice> {
  const form = new FormData()
  form.append('vendorName', payload.vendorName)
  if (payload.categoryId) form.append('categoryId', payload.categoryId)
  form.append('amount', String(payload.amount))
  form.append('status', payload.status)
  form.append('issuedDate', payload.issuedDate)
  if (payload.referenceNumber) form.append('referenceNumber', payload.referenceNumber)
  if (payload.notes) form.append('notes', payload.notes)
  if (payload.receipt) form.append('receipt', payload.receipt)

  // The shared client defaults to JSON, which would make axios serialize the FormData — override it.
  const { data } = await api.post<Invoice>(`/projects/${projectId}/budget/invoices`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
