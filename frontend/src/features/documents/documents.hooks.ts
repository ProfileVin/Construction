import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDocumentCounts, searchDocuments, uploadDocument, type DocumentFilters } from './documents.api'

export function useDocuments(projectId: string | undefined, filters: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', 'search', projectId, filters],
    queryFn: () => searchDocuments(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function useDocumentCounts(projectId: string | undefined) {
  return useQuery({
    queryKey: ['documents', 'counts', projectId],
    queryFn: () => getDocumentCounts(projectId as string),
    enabled: Boolean(projectId),
  })
}

export function useUploadDocument(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof uploadDocument>[1]) => uploadDocument(projectId as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', 'search', projectId] })
      qc.invalidateQueries({ queryKey: ['documents', 'counts', projectId] })
    },
  })
}
