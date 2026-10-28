import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { OnboardingCompanyPage } from '../features/onboarding/OnboardingCompanyPage'
import { OnboardingPreferencesPage } from '../features/onboarding/OnboardingPreferencesPage'
import { OnboardingProjectPage } from '../features/onboarding/OnboardingProjectPage'
import { OnboardingStartPage } from '../features/onboarding/OnboardingStartPage'
import { BudgetPage } from '../pages/BudgetPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DocumentsPage } from '../pages/DocumentsPage'
import { SchedulePage } from '../pages/SchedulePage'
import { TaskLogPage } from '../pages/TaskLogPage'
import { TeamPage } from '../pages/TeamPage'

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
      { path: '/schedule', element: <SchedulePage /> },
      { path: '/task-log', element: <TaskLogPage /> },
      { path: '/budget', element: <BudgetPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/team', element: <TeamPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
