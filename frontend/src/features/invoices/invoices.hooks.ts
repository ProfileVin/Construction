import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvoiceSummary, markInvoicePaid, searchInvoices, type InvoiceFilters } from './invoices.api'

export function useInvoiceSearch(projectId: string | undefined, filters: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', 'list', projectId, filters],
    queryFn: () => searchInvoices(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function useInvoiceSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'summary', projectId],
    queryFn: () => getInvoiceSummary(projectId as string),
    enabled: Boolean(projectId),
  })
}

export function useMarkInvoicePaid(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => markInvoicePaid(projectId as string, invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices', 'list', projectId] })
      qc.invalidateQueries({ queryKey: ['invoices', 'summary', projectId] })
      // The Overview's invoice table shows the same rows.
      qc.invalidateQueries({ queryKey: ['budget', 'invoices', projectId] })
      qc.invalidateQueries({ queryKey: ['budget', 'summary', projectId] })
    },
  })
}
