import { api } from '../../lib/api'
import type { Invoice, InvoiceStatus, PagedInvoices } from '../budget/budget.api'

export interface InvoiceSummary {
  /** Project budget + approved change orders. */
  totalContractValue: number
  totalBilledToDate: number
  /** Paid + Scheduled. */
  approvedInvoices: number
}

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus
  page: number
  pageSize: number
}

const base = (projectId: string) => `/projects/${projectId}/budget/invoices`

export async function searchInvoices(projectId: string, filters: InvoiceFilters): Promise<PagedInvoices> {
  const { data } = await api.get<PagedInvoices>(base(projectId), { params: filters })
  return data
}

export async function getInvoiceSummary(projectId: string): Promise<InvoiceSummary> {
  const { data } = await api.get<InvoiceSummary>(`${base(projectId)}/summary`)
  return data
}

export async function markInvoicePaid(projectId: string, invoiceId: string): Promise<Invoice> {
  const { data } = await api.post<Invoice>(`${base(projectId)}/${invoiceId}/mark-paid`)
  return data
}
