import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '../stores/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
