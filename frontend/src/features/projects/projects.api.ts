import { api } from '../../lib/api'

export interface EnumOption {
  value: string
  label: string
}

export interface ProjectOptions {
  types: EnumOption[]
  statuses: EnumOption[]
}

export interface Project {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  budgetTotal: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectPayload {
  name: string
  type: string
  status: string
  description?: string | null
}

interface ReferenceOptions {
  projectTypes: EnumOption[]
  projectStatuses: EnumOption[]
}

export async function getProjectOptions(): Promise<ProjectOptions> {
  // NOTE: GET /api/projects/options was never mapped by ProjectsEndpoints (BUG-003) — the
  // reference endpoint already serves the same seeded ProjectType/ProjectStatus lookups.
  const { data } = await api.get<ReferenceOptions>('/reference/options')
  return { types: data.projectTypes, statuses: data.projectStatuses }
}

export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects/')
  return data
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const { data } = await api.post<Project>('/projects/', payload)
  return data
}
