import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import {
  completeOnboarding,
  getOnboardingOptions,
  updateCompany,
  updatePreferences,
} from './onboarding.api'

export function useOnboardingOptions() {
  return useQuery({
    queryKey: ['onboarding', 'options'],
    queryFn: getOnboardingOptions,
    staleTime: 60 * 60 * 1000,
  })
}

export function useUpdatePreferences() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: (user) => setUser(user),
  })
}

export function useUpdateCompany() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (companyDescription: string) => updateCompany(companyDescription),
    onSuccess: (user) => setUser(user),
  })
}

export function useCompleteOnboarding() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (startMode: string | null) => completeOnboarding(startMode),
    onSuccess: (user) => setUser(user),
  })
}
