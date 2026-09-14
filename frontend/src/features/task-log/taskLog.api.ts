import { api } from '../../lib/api'
import type { ProjectTask, ProjectTaskStatus } from '../dashboard/dashboard.api'

export interface TaskLogFilters {
  search?: string
  phaseId?: string
  status?: ProjectTaskStatus
  fromDate?: string
  toDate?: string
  page: number
  pageSize: number
}

export interface PagedTasks {
  items: ProjectTask[]
  totalCount: number
  page: number
  pageSize: number
}

export async function searchTasks(projectId: string, filters: TaskLogFilters): Promise<PagedTasks> {
  const { data } = await api.get<PagedTasks>(`/projects/${projectId}/task-log`, { params: filters })
  return data
}
