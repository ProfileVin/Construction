import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ComingSoonPage } from '../components/ComingSoonPage'
import { ChangeOrdersPanel } from '../features/change-orders/ChangeOrdersPanel'
import { BudgetSummaryCard } from '../features/dashboard/BudgetSummaryCard'
import { useSelectedProject } from '../features/dashboard/dashboard.hooks'
import { InvoicesTabPanel } from '../features/invoices/InvoicesTabPanel'
import { NewProjectDialog } from '../features/projects/NewProjectDialog'
import { PurchaseOrdersPanel } from '../features/purchase-orders/PurchaseOrdersPanel'
import { BudgetTabs } from '../features/budget/BudgetTabs'
import { BUDGET_TABS, isBudgetTab, type BudgetTab } from '../features/budget/budget.tabs'
import { CategoryBreakdownPanel } from '../features/budget/CategoryBreakdownPanel'
import { InvoicesPanel } from '../features/budget/InvoicesPanel'
import { useAuthStore } from '../stores/authStore'

export function BudgetPage() {
  const user = useAuthStore((s) => s.user)
  const { projects, project } = useSelectedProject()
  const [newProjectVisible, setNewProjectVisible] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const categoriesRef = useRef<HTMLDivElement>(null)
  const scrollToCategories = () => categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })

  const tabParam = searchParams.get('tab')
  const tab: BudgetTab = isBudgetTab(tabParam) ? tabParam : 'overview'
  const changeTab = (next: BudgetTab) => setSearchParams(next === 'overview' ? {} : { tab: next })

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
      <BudgetTabs value={tab} onChange={changeTab} />

      {tab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BudgetSummaryCard
              label="Total Allocated Budget"
              amount={project.budgetTotal}
              currencyCode={currencyCode}
              onOpenDetails={scrollToCategories}
              className="border border-slate-200"
            />
            <BudgetSummaryCard
              label="Total Actual Spent"
              amount={project.totalSpent}
              currencyCode={currencyCode}
              onOpenDetails={scrollToCategories}
              className="border border-slate-200"
            />
            <BudgetSummaryCard
              label="Remaining Balance"
              amount={remainingBalance}
              currencyCode={currencyCode}
              onOpenDetails={scrollToCategories}
              className="border border-slate-200"
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
        </>
      ) : tab === 'purchase-orders' ? (
        <PurchaseOrdersPanel projectId={project.id} currencyCode={currencyCode} />
      ) : tab === 'change-orders' ? (
        <ChangeOrdersPanel projectId={project.id} currencyCode={currencyCode} />
      ) : tab === 'invoices' ? (
        <InvoicesTabPanel projectId={project.id} currencyCode={currencyCode} />
      ) : (
        <ComingSoonPage title={BUDGET_TABS.find((t) => t.value === tab)?.label ?? ''} />
      )}
    </div>
  )
}
