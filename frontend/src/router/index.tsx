import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ComingSoonPage } from '../components/ComingSoonPage'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { OnboardingCompanyPage } from '../features/onboarding/OnboardingCompanyPage'
import { OnboardingPreferencesPage } from '../features/onboarding/OnboardingPreferencesPage'
import { OnboardingProjectPage } from '../features/onboarding/OnboardingProjectPage'
import { OnboardingStartPage } from '../features/onboarding/OnboardingStartPage'
import { DashboardPage } from '../pages/DashboardPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPreferencesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding/company',
    element: (
      <ProtectedRoute>
        <OnboardingCompanyPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding/start',
    element: (
      <ProtectedRoute>
        <OnboardingStartPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding/project',
    element: (
      <ProtectedRoute>
        <OnboardingProjectPage />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/schedule', element: <ComingSoonPage title="Schedule" /> },
      { path: '/task-log', element: <ComingSoonPage title="Task Log" /> },
      { path: '/budget', element: <ComingSoonPage title="Budget & Finance" /> },
      { path: '/documents', element: <ComingSoonPage title="Document" /> },
      { path: '/team', element: <ComingSoonPage title="Team" /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
