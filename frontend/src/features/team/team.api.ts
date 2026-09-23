import { api } from '../../lib/api'

export type TeamMemberStatus = 'Active' | 'Deactivated'

export interface TeamMember {
  id: string
  projectId: string
  fullName: string
  roleTitle: string
  specialty: string | null
  email: string
  phaseId: string | null
  phaseName: string | null
  status: TeamMemberStatus
  activeTaskCount: number
  createdAt: string
  updatedAt: string
}

export interface PagedTeamMembers {
  items: TeamMember[]
  totalCount: number
  page: number
  pageSize: number
}

export interface TeamFilters {
  search?: string
  role?: string
  status?: TeamMemberStatus
}

export interface SaveTeamMemberPayload {
  fullName: string
  roleTitle: string
  specialty: string | null
  email: string
  phaseId: string | null
}

export async function searchTeamMembers(
  projectId: string,
  filters: TeamFilters & { page: number; pageSize: number },
): Promise<PagedTeamMembers> {
  const { data } = await api.get<PagedTeamMembers>(`/projects/${projectId}/team`, { params: filters })
  return data
}

export async function getTeamRoles(projectId: string): Promise<string[]> {
  const { data } = await api.get<string[]>(`/projects/${projectId}/team/roles`)
  return data
}

export async function createTeamMember(projectId: string, payload: SaveTeamMemberPayload): Promise<TeamMember> {
  const { data } = await api.post<TeamMember>(`/projects/${projectId}/team`, payload)
  return data
}

export async function updateTeamMember(
  projectId: string,
  memberId: string,
  payload: SaveTeamMemberPayload,
): Promise<TeamMember> {
  const { data } = await api.put<TeamMember>(`/projects/${projectId}/team/${memberId}`, payload)
  return data
}

export async function setTeamMemberStatus(
  projectId: string,
  memberId: string,
  status: TeamMemberStatus,
): Promise<TeamMember> {
  const { data } = await api.put<TeamMember>(`/projects/${projectId}/team/${memberId}/status`, { status })
  return data
}

/** Fetched as a blob because the endpoint needs the bearer header — a plain `<a href>` can't send it. */
export async function exportTeamMembers(projectId: string, filters: TeamFilters): Promise<Blob> {
  const { data } = await api.get<Blob>(`/projects/${projectId}/team/export`, {
    params: filters,
    responseType: 'blob',
  })
  return data
}
