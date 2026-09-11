import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, getProjectOptions, listProjects } from './projects.api'

export function useProjectOptions() {
  return useQuery({
    queryKey: ['projects', 'options'],
    queryFn: getProjectOptions,
    staleTime: 60 * 60 * 1000,
  })
}

export function useProjects() {
  return useQuery({ queryKey: ['projects', 'list'], queryFn: listProjects })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'list'] }),
  })
}
