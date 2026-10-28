import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderSummary,
  markPurchaseOrderPaid,
  searchPurchaseOrders,
  type CreatePurchaseOrderPayload,
  type PurchaseOrderFilters,
} from './purchaseOrders.api'

export function usePurchaseOrders(projectId: string | undefined, filters: PurchaseOrderFilters) {
  return useQuery({
    queryKey: ['purchase-orders', 'list', projectId, filters],
    queryFn: () => searchPurchaseOrders(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function usePurchaseOrderSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['purchase-orders', 'summary', projectId],
    queryFn: () => getPurchaseOrderSummary(projectId as string),
    enabled: Boolean(projectId),
  })
}

/** Every PO change moves the PO KPIs and the Overview's Committed POs (ADR-0024). */
function useInvalidatePurchaseOrders(projectId: string | undefined) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['purchase-orders', 'list', projectId] })
    qc.invalidateQueries({ queryKey: ['purchase-orders', 'summary', projectId] })
    qc.invalidateQueries({ queryKey: ['budget', 'summary', projectId] })
  }
}

export function useCreatePurchaseOrder(projectId: string | undefined) {
  const invalidate = useInvalidatePurchaseOrders(projectId)
  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) => createPurchaseOrder(projectId as string, payload),
    onSuccess: invalidate,
  })
}

export function useMarkPurchaseOrderPaid(projectId: string | undefined) {
  const invalidate = useInvalidatePurchaseOrders(projectId)
  return useMutation({
    mutationFn: (purchaseOrderId: string) => markPurchaseOrderPaid(projectId as string, purchaseOrderId),
    onSuccess: invalidate,
  })
}

export function useDeletePurchaseOrder(projectId: string | undefined) {
  const invalidate = useInvalidatePurchaseOrders(projectId)
  return useMutation({
    mutationFn: (purchaseOrderId: string) => deletePurchaseOrder(projectId as string, purchaseOrderId),
    onSuccess: invalidate,
  })
}
