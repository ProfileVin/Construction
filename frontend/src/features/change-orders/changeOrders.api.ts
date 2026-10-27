import { api } from '../../lib/api'

export type ChangeOrderStatus = 'Pending' | 'Approved' | 'Rejected'

export interface ChangeOrder {
  id: string
  projectId: string
  coNumber: string
  description: string
  amount: number
  status: ChangeOrderStatus
  /** YYYY-MM-DD */
  requestedDate: string
  reason: string | null
  /** When it was approved or rejected; null while Pending. */
  decidedAt: string | null
  createdAt: string
}

export interface PagedChangeOrders {
  items: ChangeOrder[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ChangeOrderSummary {
  /** Pending + Approved; rejected change orders are excluded. */
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
  reason?: string
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

export async function createChangeOrder(projectId: string, payload: CreateChangeOrderPayload): Promise<ChangeOrder> {
  const { data } = await api.post<ChangeOrder>(base(projectId), payload)
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
