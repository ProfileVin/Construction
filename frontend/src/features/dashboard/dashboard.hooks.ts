import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProjectStore } from '../../stores/projectStore'
import {
  createActivityLog,
  createProjectTask,
  deleteProjectTask,
  extendTaskDeadline,
  getProjectTask,
  listActivityLog,
  listProjectTasks,
  listTaskActivityLog,
  updateActivityLog,
  updateProjectTask,
  type UpdateProjectTaskPayload,
} from './dashboard.api'
import { useProjects } from '../projects/projects.hooks'

export function useSelectedProject() {
  const { data: projects } = useProjects()
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId)
  const project = projects?.find((p) => p.id === selectedProjectId) ?? projects?.[0] ?? null
  return { projects, project }
}

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'tasks', projectId],
    queryFn: () => listProjectTasks(projectId as string),
    enabled: Boolean(projectId),
  })
}

/** Keyed under the project's task key, so every task invalidation refreshes it too. */
export function useProjectTask(projectId: string | undefined, taskId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'tasks', projectId, taskId],
    queryFn: () => getProjectTask(projectId as string, taskId as string),
    enabled: Boolean(projectId && taskId),
  })
}

/** Everything a task create/edit can change: task lists, the Recent Log, attachments and Active Tasks counts. */
function invalidateTaskQueries(qc: QueryClient, projectId: string | undefined) {
  qc.invalidateQueries({ queryKey: ['dashboard', 'tasks', projectId] })
  qc.invalidateQueries({ queryKey: ['dashboard', 'activity-log', projectId] })
  qc.invalidateQueries({ queryKey: ['taskLog', 'search', projectId] })
  qc.invalidateQueries({ queryKey: ['documents', 'search', projectId] })
  qc.invalidateQueries({ queryKey: ['documents', 'counts', projectId] })
  qc.invalidateQueries({ queryKey: ['team', 'search', projectId] })
}

export function useCreateProjectTask(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createProjectTask>[1]) =>
      createProjectTask(projectId as string, payload),
    onSuccess: () => invalidateTaskQueries(qc, projectId),
  })
}

export function useUpdateProjectTask(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateProjectTaskPayload }) =>
      updateProjectTask(projectId as string, taskId, payload),
    onSuccess: () => invalidateTaskQueries(qc, projectId),
  })
}

export function useDeleteProjectTask(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteProjectTask(projectId as string, taskId),
    onSuccess: () => invalidateTaskQueries(qc, projectId),
  })
}

export function useExtendTaskDeadline(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, deadline, reason }: { taskId: string; deadline: string; reason: string }) =>
      extendTaskDeadline(projectId as string, taskId, { deadline, reason }),
    onSuccess: () => invalidateTaskQueries(qc, projectId),
  })
}

/** Keyed under the project's activity-log key, so every activity-log invalidation refreshes it too. */
export function useTaskActivityLog(projectId: string | undefined, taskId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'activity-log', projectId, taskId],
    queryFn: () => listTaskActivityLog(projectId as string, taskId as string),
    enabled: Boolean(projectId && taskId),
  })
}

export function useCreateActivityLog(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createActivityLog>[1]) => createActivityLog(projectId as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'activity-log', projectId] })
      qc.invalidateQueries({ queryKey: ['documents', 'search', projectId] })
      qc.invalidateQueries({ queryKey: ['documents', 'counts', projectId] })
    },
  })
}

export function useUpdateActivityLog(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, description }: { entryId: string; description: string }) =>
      updateActivityLog(projectId as string, entryId, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'activity-log', projectId] }),
  })
}

export function useActivityLog(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'activity-log', projectId],
    queryFn: () => listActivityLog(projectId as string),
    enabled: Boolean(projectId),
  })
}
