import { api } from '../../lib/api'
import type { ProjectTaskStatus } from '../dashboard/dashboard.api'

export type PhaseStatus = ProjectTaskStatus

export interface ConstructionPhase {
  id: string
  projectId: string
  name: string
  startDate: string
  endDate: string
  percentComplete: number
  status: PhaseStatus
  checkpointLabel: string | null
  createdAt: string
}

export interface CreatePhasePayload {
  name: string
  startDate: string
  endDate: string
  percentComplete: number
  status: PhaseStatus
  checkpointLabel: string | null
}

export async function listPhases(projectId: string): Promise<ConstructionPhase[]> {
  const { data } = await api.get<ConstructionPhase[]>(`/projects/${projectId}/phases`)
  return data
}

export async function createPhase(projectId: string, payload: CreatePhasePayload): Promise<ConstructionPhase> {
  const { data } = await api.post<ConstructionPhase>(`/projects/${projectId}/phases`, payload)
  return data
}
