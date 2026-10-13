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
  /** The `ProjectDocument` attached when the task was created, if any. */
  attachmentDocumentId: string | null
  createdAt: string
}

export interface CreateProjectTaskPayload {
  title: string
  assigneeName: string
  assignedDate: string
  deadline: string
  phaseId?: string | null
  status: ProjectTaskStatus
  attachment?: File
}

/** The editable fields — the assigned date and attachment stay as created. */
export interface UpdateProjectTaskPayload {
  title: string
  assigneeName: string
  /** YYYY-MM-DD */
  deadline: string
  phaseId: string | null
  status: ProjectTaskStatus
}

export interface ActivityLogEntry {
  id: string
  projectId: string
  projectTaskId: string | null
  /** e.g. "LOG-2026-081" */
  logNumber: string
  description: string
  occurredAt: string
  /** The linked task's details — null when the entry has no task. */
  taskTitle: string | null
  assigneeName: string | null
  phaseName: string | null
  /** 1-based position of the phase in start-date order ("03." in "03. Electrical Rough-in"). */
  phaseNumber: number | null
  /** Trade tag from a manual "New Log" entry (Framing, Structural, …). */
  category: string | null
  attachmentDocumentId: string | null
}

export interface CreateActivityLogPayload {
  taskId: string
  category: string
  assigneeName: string
  note: string
  attachment?: File
}

export async function listProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data } = await api.get<ProjectTask[]>(`/projects/${projectId}/tasks`)
  return data
}

export async function createProjectTask(
  projectId: string,
  payload: CreateProjectTaskPayload,
): Promise<ProjectTask> {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('assigneeName', payload.assigneeName)
  form.append('assignedDate', payload.assignedDate)
  form.append('deadline', payload.deadline)
  form.append('status', payload.status)
  if (payload.phaseId) form.append('phaseId', payload.phaseId)
  if (payload.attachment) form.append('attachment', payload.attachment)

  // The shared client defaults to JSON, which would make axios serialize the FormData — override it.
  const { data } = await api.post<ProjectTask>(`/projects/${projectId}/tasks`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  payload: UpdateProjectTaskPayload,
): Promise<ProjectTask> {
  const { data } = await api.put<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, payload)
  return data
}

export async function listActivityLog(projectId: string): Promise<ActivityLogEntry[]> {
  const { data } = await api.get<ActivityLogEntry[]>(`/projects/${projectId}/activity-log`)
  return data
}

export async function createActivityLog(
  projectId: string,
  payload: CreateActivityLogPayload,
): Promise<ActivityLogEntry> {
  const form = new FormData()
  form.append('taskId', payload.taskId)
  form.append('category', payload.category)
  form.append('assigneeName', payload.assigneeName)
  form.append('note', payload.note)
  if (payload.attachment) form.append('attachment', payload.attachment)

  // Same multipart override as createProjectTask.
  const { data } = await api.post<ActivityLogEntry>(`/projects/${projectId}/activity-log`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updateActivityLog(
  projectId: string,
  entryId: string,
  description: string,
): Promise<ActivityLogEntry> {
  const { data } = await api.put<ActivityLogEntry>(`/projects/${projectId}/activity-log/${entryId}`, { description })
  return data
}
