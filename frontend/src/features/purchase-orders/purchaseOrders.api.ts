import { api } from '../../lib/api'

export type PurchaseOrderStatus = 'Pending' | 'Paid'

export interface PurchaseOrderLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface PurchaseOrder {
  id: string
  projectId: string
  poNumber: string
  vendorName: string
  /** "Electrical materials +2 more" — the second line under the vendor. */
  itemSummary: string
  totalAmount: number
  status: PurchaseOrderStatus
  /** YYYY-MM-DD */
  issuedDate: string
  /** YYYY-MM-DD */
  deliveryDate: string | null
  notes: string | null
  createdAt: string
  lineItems: PurchaseOrderLineItem[]
}

export interface PagedPurchaseOrders {
  items: PurchaseOrder[]
  totalCount: number
  page: number
  pageSize: number
}

export interface PurchaseOrderSummary {
  totalCommitted: number
  pendingApprovals: number
  disbursedToDate: number
  unallocated: number
}

export interface PurchaseOrderFilters {
  search?: string
  status?: PurchaseOrderStatus
  page: number
  pageSize: number
}

export interface CreatePurchaseOrderPayload {
  vendorName: string
  lineItems: { description: string; quantity: number; unitPrice: number }[]
  /** YYYY-MM-DD */
  deliveryDate?: string
  notes?: string
}

const base = (projectId: string) => `/projects/${projectId}/budget/purchase-orders`

export async function searchPurchaseOrders(projectId: string, filters: PurchaseOrderFilters): Promise<PagedPurchaseOrders> {
  const { data } = await api.get<PagedPurchaseOrders>(base(projectId), { params: filters })
  return data
}

export async function getPurchaseOrderSummary(projectId: string): Promise<PurchaseOrderSummary> {
  const { data } = await api.get<PurchaseOrderSummary>(`${base(projectId)}/summary`)
  return data
}

export async function createPurchaseOrder(projectId: string, payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
  const { data } = await api.post<PurchaseOrder>(base(projectId), payload)
  return data
}

export async function markPurchaseOrderPaid(projectId: string, purchaseOrderId: string): Promise<PurchaseOrder> {
  const { data } = await api.post<PurchaseOrder>(`${base(projectId)}/${purchaseOrderId}/mark-paid`)
  return data
}

export async function deletePurchaseOrder(projectId: string, purchaseOrderId: string): Promise<void> {
  await api.delete(`${base(projectId)}/${purchaseOrderId}`)
}
