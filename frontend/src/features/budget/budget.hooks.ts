import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createInvoice, getBudgetSummary, searchInvoices } from './budget.api'

export function useBudgetSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['budget', 'summary', projectId],
    queryFn: () => getBudgetSummary(projectId as string),
    enabled: Boolean(projectId),
  })
}

export function useInvoices(projectId: string | undefined, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['budget', 'invoices', projectId, page, pageSize],
    queryFn: () => searchInvoices(projectId as string, { page, pageSize }),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function useCreateInvoice(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createInvoice>[1]) => createInvoice(projectId as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget', 'summary', projectId] })
      qc.invalidateQueries({ queryKey: ['budget', 'invoices', projectId] })
    },
  })
}
