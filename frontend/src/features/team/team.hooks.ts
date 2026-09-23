import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTeamMember,
  getTeamRoles,
  searchTeamMembers,
  setTeamMemberStatus,
  updateTeamMember,
  type SaveTeamMemberPayload,
  type TeamFilters,
  type TeamMemberStatus,
} from './team.api'

export function useTeamMembers(projectId: string | undefined, filters: TeamFilters & { page: number; pageSize: number }) {
  return useQuery({
    queryKey: ['team', 'search', projectId, filters],
    queryFn: () => searchTeamMembers(projectId as string, filters),
    enabled: Boolean(projectId),
    placeholderData: (prev) => prev,
  })
}

export function useTeamRoles(projectId: string | undefined) {
  return useQuery({
    queryKey: ['team', 'roles', projectId],
    queryFn: () => getTeamRoles(projectId as string),
    enabled: Boolean(projectId),
  })
}

function useInvalidateTeam(projectId: string | undefined) {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['team', 'search', projectId] })
    qc.invalidateQueries({ queryKey: ['team', 'roles', projectId] })
  }
}

export function useCreateTeamMember(projectId: string | undefined) {
  const invalidate = useInvalidateTeam(projectId)
  return useMutation({
    mutationFn: (payload: SaveTeamMemberPayload) => createTeamMember(projectId as string, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateTeamMember(projectId: string | undefined) {
  const invalidate = useInvalidateTeam(projectId)
  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: SaveTeamMemberPayload }) =>
      updateTeamMember(projectId as string, memberId, payload),
    onSuccess: invalidate,
  })
}

export function useSetTeamMemberStatus(projectId: string | undefined) {
  const invalidate = useInvalidateTeam(projectId)
  return useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: TeamMemberStatus }) =>
      setTeamMemberStatus(projectId as string, memberId, status),
    onSuccess: invalidate,
  })
}
