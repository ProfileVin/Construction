import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  measurementSystem: string
  currency: string
  timeZoneId: string
  temperatureUnit: string
  companyDescription: string | null
  projectStartMode: string | null
  onboardingCompletedAt: string | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'construction-auth' },
  ),
)

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.token)
export const selectNeedsOnboarding = (state: AuthState) =>
  Boolean(state.token) && !state.user?.onboardingCompletedAt
