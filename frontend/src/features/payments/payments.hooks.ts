import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPayment,
  deletePayment,
  getPaymentPayees,
  getPaymentSummary,
  markPaymentCleared,
  searchPayments,
  type CreatePaymentPayload,
  type PaymentFilters,
} from './payments.api'

export function usePayments(projectId: string | undefined, filters: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', 'list', projectId, filters],
    queryFn: () => searchPayments(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function usePaymentSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'summary', projectId],
    queryFn: () => getPaymentSummary(projectId as string),
    enabled: Boolean(projectId),
  })
}

export function usePaymentPayees(projectId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'payees', projectId],
    queryFn: () => getPaymentPayees(projectId as string),
    enabled: Boolean(projectId),
  })
}

/** Payments are a standalone ledger (ADR-0028), so only the payment queries move. */
function useInvalidatePayments(projectId: string | undefined) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['payments', 'list', projectId] })
    qc.invalidateQueries({ queryKey: ['payments', 'summary', projectId] })
    qc.invalidateQueries({ queryKey: ['payments', 'payees', projectId] })
  }
}

export function useCreatePayment(projectId: string | undefined) {
  const invalidate = useInvalidatePayments(projectId)
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(projectId as string, payload),
    onSuccess: invalidate,
  })
}

export function useMarkPaymentCleared(projectId: string | undefined) {
  const invalidate = useInvalidatePayments(projectId)
  return useMutation({
    mutationFn: (paymentId: string) => markPaymentCleared(projectId as string, paymentId),
    onSuccess: invalidate,
  })
}

export function useDeletePayment(projectId: string | undefined) {
  const invalidate = useInvalidatePayments(projectId)
  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(projectId as string, paymentId),
    onSuccess: invalidate,
  })
}
