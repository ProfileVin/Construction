import { api } from '../../lib/api'

export type ProjectTaskStatus = 'Upcoming' | 'InProgress' | 'Completed'

export interface ProjectTask {
  id: string
  projectId: string
  title: string
  assigneeName: string
  assignedDate: string
  deadline: string
  phaseId: string | null
  phaseName: string | null
  status: ProjectTaskStatus
  createdAt: string
}

export interface CreateProjectTaskPayload {
  title: string
  assigneeName: string
  assignedDate: string
  deadline: string
  phaseId: string | null
  status: ProjectTaskStatus
}

export interface ActivityLogEntry {
  id: string
  projectId: string
  projectTaskId: string | null
  description: string
  occurredAt: string
}

export async function listProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data } = await api.get<ProjectTask[]>(`/projects/${projectId}/tasks`)
  return data
}

export async function createProjectTask(
  projectId: string,
  payload: CreateProjectTaskPayload,
): Promise<ProjectTask> {
  const { data } = await api.post<ProjectTask>(`/projects/${projectId}/tasks`, payload)
  return data
}

export async function listActivityLog(projectId: string): Promise<ActivityLogEntry[]> {
  const { data } = await api.get<ActivityLogEntry[]>(`/projects/${projectId}/activity-log`)
  return data
}
