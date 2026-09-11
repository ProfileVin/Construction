import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useProjectStore } from '../../stores/projectStore'
import { createProjectTask, listActivityLog, listProjectTasks } from './dashboard.api'
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

export function useCreateProjectTask(projectId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Parameters<typeof createProjectTask>[1]) =>
      createProjectTask(projectId as string, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard', 'tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['dashboard', 'activity-log', projectId] })
    },
  })
}

export function useActivityLog(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'activity-log', projectId],
    queryFn: () => listActivityLog(projectId as string),
    enabled: Boolean(projectId),
  })
}
