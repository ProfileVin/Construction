import { useQuery } from '@tanstack/react-query'
import { searchTasks, type TaskLogFilters } from './taskLog.api'

export function useTaskLog(projectId: string | undefined, filters: TaskLogFilters) {
  return useQuery({
    queryKey: ['taskLog', 'search', projectId, filters],
    queryFn: () => searchTasks(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}
