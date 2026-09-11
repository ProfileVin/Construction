import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AssignedTasksPanel } from '../features/dashboard/AssignedTasksPanel'
import { BudgetSummaryCard } from '../features/dashboard/BudgetSummaryCard'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { RecentLogPanel } from '../features/dashboard/RecentLogPanel'
import { NewProjectDialog } from '../features/projects/NewProjectDialog'
import { useAuthStore } from '../stores/authStore'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { projects, project } = useSelectedProject()
  const [newProjectVisible, setNewProjectVisible] = useState(false)

  if (projects === undefined) {
    return (
      <div className="flex justify-center py-20">
        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-brand-ink">Create your first project</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set up a project to start tracking budget, tasks and activity.
        </p>
        <Button label="New project" icon="pi pi-plus" className="mt-6" onClick={() => setNewProjectVisible(true)} />
        <NewProjectDialog visible={newProjectVisible} onHide={() => setNewProjectVisible(false)} />
      </div>
    )
  }

  return (
    <div key={project.id} className="flex flex-col gap-4">
      {!user?.onboardingCompletedAt && (
        <Link
          to="/onboarding"
          className="flex items-center justify-between gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-5 no-underline transition hover:bg-brand/10"
        >
          <span>
            <span className="block text-[15px] font-semibold text-brand-ink">
              Finish setting up your dashboard
            </span>
            <span className="block text-sm text-slate-600">
              Set your units, currency and timezone, then create your first project.
            </span>
          </span>
          <i className="pi pi-arrow-right text-brand" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BudgetSummaryCard
          label="Budget"
          amount={project.budgetTotal}
          currencyCode={user?.currency ?? 'USD'}
          onOpenDetails={() => navigate('/budget')}
        />
        <BudgetSummaryCard
          label="Total Spent"
          amount={project.totalSpent}
          currencyCode={user?.currency ?? 'USD'}
          onOpenDetails={() => navigate('/budget')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AssignedTasksPanel projectId={project.id} />
        <RecentLogPanel projectId={project.id} />
      </div>
    </div>
  )
}
