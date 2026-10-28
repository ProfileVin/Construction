import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPhase, listPhases } from './schedule.api'

export function usePhases(projectId: string | undefined) {
  return useQuery({
    queryKey: ['schedule', 'phases', projectId],
    queryFn: () => listPhases(projectId as string),
    enabled: Boolean(projectId),
  })
}

export function useCreatePhase(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createPhase>[1]) => createPhase(projectId as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', 'phases', projectId] })
    },
  })
}
