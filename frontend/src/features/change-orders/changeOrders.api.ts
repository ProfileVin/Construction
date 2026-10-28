import { api } from '../../lib/api'
import type { DocumentFormat } from '../documents/documents.api'

/** Pending = awaiting GC review; PendingOwnerApproval = reviewed, awaiting owner sign-off. */
export type ChangeOrderStatus = 'Pending' | 'PendingOwnerApproval' | 'Approved' | 'Rejected'

export interface ChangeOrderAttachment {
  documentId: string
  fileName: string
  sizeBytes: number
  format: DocumentFormat
}

export interface ChangeOrder {
  id: string
  projectId: string
  coNumber: string
  description: string
  amount: number
  status: ChangeOrderStatus
  /** YYYY-MM-DD */
  requestedDate: string
  /** One of `changeOrderReasons`. */
  reason: string | null
  /** Free-text summary & scope. */
  scope: string | null
  categoryId: string | null
  categoryName: string | null
  scheduleImpactDays: number
  requestedByName: string | null
  /** Step 1 — GC review (also set when rejected at this step). */
  contractorReviewedAt: string | null
  contractorReviewedByName: string | null
  /** Step 2 — owner sign-off, with `decidedAt`. */
  ownerDecidedByName: string | null
  /** When it was finally approved or rejected; null while either step is pending. */
  decidedAt: string | null
  createdAt: string
  /** Only filled by `getChangeOrder` (and create/decide responses); list rows leave it empty. */
  attachments: ChangeOrderAttachment[]
}

export interface PagedChangeOrders {
  items: ChangeOrder[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ChangeOrderSummary {
  /** Both pending steps + Approved; rejected change orders are excluded. */
  totalChangeOrders: number
  pendingApprovals: number
  approved: number
}

export interface ChangeOrderFilters {
  search?: string
  status?: ChangeOrderStatus
  page: number
  pageSize: number
}

export interface CreateChangeOrderPayload {
  description: string
  amount: number
  /** YYYY-MM-DD */
  requestedDate: string
  reason: string
  scope?: string
  categoryId?: string | null
  scheduleImpactDays: number
  attachments: File[]
}

export type ChangeOrderDecision = 'approve' | 'reject'

const base = (projectId: string) => `/projects/${projectId}/budget/change-orders`

export async function searchChangeOrders(projectId: string, filters: ChangeOrderFilters): Promise<PagedChangeOrders> {
  const { data } = await api.get<PagedChangeOrders>(base(projectId), { params: filters })
  return data
}

export async function getChangeOrderSummary(projectId: string): Promise<ChangeOrderSummary> {
  const { data } = await api.get<ChangeOrderSummary>(`${base(projectId)}/summary`)
  return data
}

export async function getChangeOrder(projectId: string, changeOrderId: string): Promise<ChangeOrder> {
  const { data } = await api.get<ChangeOrder>(`${base(projectId)}/${changeOrderId}`)
  return data
}

export async function createChangeOrder(projectId: string, payload: CreateChangeOrderPayload): Promise<ChangeOrder> {
  const form = new FormData()
  form.append('description', payload.description)
  form.append('amount', String(payload.amount))
  form.append('requestedDate', payload.requestedDate)
  form.append('reason', payload.reason)
  form.append('scheduleImpactDays', String(payload.scheduleImpactDays))
  if (payload.scope) form.append('scope', payload.scope)
  if (payload.categoryId) form.append('categoryId', payload.categoryId)
  for (const file of payload.attachments) form.append('attachments', file)

  // Same multipart override as createProjectTask.
  const { data } = await api.post<ChangeOrder>(base(projectId), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function decideChangeOrder(
  projectId: string,
  changeOrderId: string,
  decision: ChangeOrderDecision,
): Promise<ChangeOrder> {
  const { data } = await api.post<ChangeOrder>(`${base(projectId)}/${changeOrderId}/${decision}`)
  return data
}
