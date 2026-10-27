import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createChangeOrder,
  decideChangeOrder,
  getChangeOrderSummary,
  searchChangeOrders,
  type ChangeOrderDecision,
  type ChangeOrderFilters,
  type CreateChangeOrderPayload,
} from './changeOrders.api'

export function useChangeOrders(projectId: string | undefined, filters: ChangeOrderFilters) {
  return useQuery({
    queryKey: ['change-orders', 'list', projectId, filters],
    queryFn: () => searchChangeOrders(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function useChangeOrderSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['change-orders', 'summary', projectId],
    queryFn: () => getChangeOrderSummary(projectId as string),
    enabled: Boolean(projectId),
  })
}

/** Approved change orders also move the Invoice tab's Total Contract Value (ADR-0025). */
function useInvalidateChangeOrders(projectId: string | undefined) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['change-orders', 'list', projectId] })
    qc.invalidateQueries({ queryKey: ['change-orders', 'summary', projectId] })
    qc.invalidateQueries({ queryKey: ['invoices', 'summary', projectId] })
  }
}

export function useCreateChangeOrder(projectId: string | undefined) {
  const invalidate = useInvalidateChangeOrders(projectId)
  return useMutation({
    mutationFn: (payload: CreateChangeOrderPayload) => createChangeOrder(projectId as string, payload),
    onSuccess: invalidate,
  })
}

export function useDecideChangeOrder(projectId: string | undefined) {
  const invalidate = useInvalidateChangeOrders(projectId)
  return useMutation({
    mutationFn: ({ changeOrderId, decision }: { changeOrderId: string; decision: ChangeOrderDecision }) =>
      decideChangeOrder(projectId as string, changeOrderId, decision),
    onSuccess: invalidate,
  })
}
