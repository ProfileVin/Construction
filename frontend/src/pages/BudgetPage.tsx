import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useRef, useState } from 'react'
import { BudgetSummaryCard } from '../features/dashboard/BudgetSummaryCard'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { NewProjectDialog } from '../features/projects/NewProjectDialog'
import { CategoryBreakdownPanel } from '../features/budget/CategoryBreakdownPanel'
import { InvoicesPanel } from '../features/budget/InvoicesPanel'
import { useAuthStore } from '../stores/authStore'

export function BudgetPage() {
  const user = useAuthStore((s) => s.user)
  const { projects, project } = useSelectedProject()
  const [newProjectVisible, setNewProjectVisible] = useState(false)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const scrollToCategories = () => categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })

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
        <p className="mt-2 text-sm text-slate-600">Set up a project to start tracking budget and expenses.</p>
        <Button label="New project" icon="pi pi-plus" className="mt-6" onClick={() => setNewProjectVisible(true)} />
        <NewProjectDialog visible={newProjectVisible} onHide={() => setNewProjectVisible(false)} />
      </div>
    )
  }

  const currencyCode = user?.currency ?? 'USD'
  const remainingBalance = project.budgetTotal - project.totalSpent

  return (
    <div key={project.id} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BudgetSummaryCard
          label="Total Allocated Budget"
          amount={project.budgetTotal}
          currencyCode={currencyCode}
          onOpenDetails={scrollToCategories}
        />
        <BudgetSummaryCard
          label="Total Actual Spent"
          amount={project.totalSpent}
          currencyCode={currencyCode}
          onOpenDetails={scrollToCategories}
        />
        <BudgetSummaryCard
          label="Remaining Balance"
          amount={remainingBalance}
          currencyCode={currencyCode}
          onOpenDetails={scrollToCategories}
          badge={{
            label: remainingBalance >= 0 ? 'Positive Balance' : 'Over Budget',
            tone: remainingBalance >= 0 ? 'positive' : 'negative',
          }}
        />
      </div>

      <div ref={categoriesRef}>
        <CategoryBreakdownPanel projectId={project.id} currencyCode={currencyCode} />
      </div>
      <InvoicesPanel projectId={project.id} currencyCode={currencyCode} />
    </div>
  )
}
