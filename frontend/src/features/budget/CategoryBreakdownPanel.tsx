import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useState } from 'react'
import { formatCurrency } from '../../lib/format'
import { CategoryProgressRow } from './CategoryProgressRow'
import { NewExpenseDialog } from './NewExpenseDialog'
import { useBudgetSummary } from './budget.hooks'

const CONTINGENCY_STYLES: Record<string, string> = {
  Healthy: 'text-emerald-700',
  Watch: 'text-amber-700',
  'At Risk': 'text-red-700',
}

interface CategoryBreakdownPanelProps {
  projectId: string
  currencyCode: string
}

export function CategoryBreakdownPanel({ projectId, currencyCode }: CategoryBreakdownPanelProps) {
  const { data, isLoading } = useBudgetSummary(projectId)
  const [dialogVisible, setDialogVisible] = useState(false)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Budget Allocation by Category</h2>
          <p className="text-sm text-slate-500">Disbursement and variance by major work packages</p>
        </div>
        <Button label="New Expense" icon="pi pi-plus" size="small" onClick={() => setDialogVisible(true)} />
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '32px', height: '32px' }} />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-blue-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Committed POs</p>
              <p className="mt-1 text-lg font-bold text-brand-ink">
                {formatCurrency(data.committedPOs, currencyCode, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unbilled Work</p>
              <p className="mt-1 text-lg font-bold text-brand-ink">
                {formatCurrency(data.unbilledWork, currencyCode, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contingency Burn</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  data.contingencyStatusLabel ? CONTINGENCY_STYLES[data.contingencyStatusLabel] : 'text-brand-ink'
                }`}
              >
                {data.contingencyBurnPercent !== null
                  ? `${data.contingencyBurnPercent.toFixed(1)}% ${data.contingencyStatusLabel}`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            {data.categories.length === 0 ? (
              <p className="text-sm text-slate-500">No budget categories yet.</p>
            ) : (
              data.categories.map((category, i) => (
                <CategoryProgressRow key={category.id} category={category} colorIndex={i} currencyCode={currencyCode} />
              ))
            )}
          </div>
        </>
      )}

      <NewExpenseDialog
        projectId={projectId}
        categories={data?.categories ?? []}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
      />
    </div>
  )
}
