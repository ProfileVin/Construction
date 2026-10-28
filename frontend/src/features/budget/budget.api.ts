import { api } from '../../lib/api'

export type InvoiceStatus = 'Pending' | 'Paid'

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
  vendorName: string
  categoryId: string | null
  amount: number
  status: InvoiceStatus
  issuedDate: string
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
  const { data } = await api.post<Invoice>(`/projects/${projectId}/budget/invoices`, payload)
  return data
}
