import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import type { Invoice, InvoiceStatus } from '../budget/budget.api'
import { useBudgetSummary } from '../budget/budget.hooks'
import { NewExpenseDialog } from '../budget/NewExpenseDialog'
import { BudgetSummaryCard } from '../dashboard/BudgetSummaryCard'
import { InvoiceDetailsDialog } from './InvoiceDetailsDialog'
import type { InvoiceFilters } from './invoices.api'
import { useInvoiceSearch, useInvoiceSummary } from './invoices.hooks'
import { InvoicesTable } from './InvoicesTable'

const PAGE_SIZE = 8

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Scheduled', value: 'Scheduled' },
]

interface InvoicesTabPanelProps {
  projectId: string
  currencyCode: string
}

/** The Budget "Invoice" sub-tab (FEAT-027); the Overview keeps its own `InvoicesPanel`. */
export function InvoicesTabPanel({ projectId, currencyCode }: InvoicesTabPanelProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | null>(null)
  const [page, setPage] = useState(1)
  const [createVisible, setCreateVisible] = useState(false)
  const [inspecting, setInspecting] = useState<Invoice | null>(null)

  const filters: InvoiceFilters = {
    search: search || undefined,
    status: status ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = useInvoiceSearch(projectId, filters)
  const { data: summary } = useInvoiceSummary(projectId)
  // "New Invoice" reuses "Record New Expense", which needs the budget categories.
  const { data: budget } = useBudgetSummary(projectId)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const kpis = [
    { label: 'Total Contract Value', amount: summary?.totalContractValue },
    { label: 'Total Billed to Date', amount: summary?.totalBilledToDate },
    { label: 'Approved Invoices', amount: summary?.approvedInvoices },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-brand-ink">Invoices</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track vendor invoices and what has been billed against the contract.
          </p>
        </div>
        <Button label="New Invoice" icon="pi pi-plus" onClick={() => setCreateVisible(true)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <BudgetSummaryCard
            key={kpi.label}
            label={kpi.label}
            amount={kpi.amount ?? 0}
            currencyCode={currencyCode}
            fractionDigits={2}
            className="border border-slate-200"
          />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="toolbar-band flex flex-wrap items-center gap-3 rounded-xl p-3">
          <span className="flat-search flex min-w-[220px] flex-1 items-center gap-2">
            <i className="pi pi-search text-slate-500" aria-hidden />
            <InputText
              value={search}
              onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
              placeholder="Search"
              aria-label="Search invoices"
              className="w-full"
            />
          </span>
          <div className="w-full sm:w-64">
            <Dropdown
              value={status}
              options={STATUS_OPTIONS}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => resetToFirstPage(setStatus)(e.value ?? null)}
              placeholder="All Statuses"
              showClear
              dropdownIcon="pi pi-sliders-h"
              aria-label="Filter by status"
              className="w-full"
            />
          </div>
        </div>

        <InvoicesTable
          data={data}
          isLoading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          currencyCode={currencyCode}
          onPageChange={setPage}
          onInspect={setInspecting}
        />
      </div>

      <NewExpenseDialog
        projectId={projectId}
        categories={budget?.categories ?? []}
        visible={createVisible}
        onHide={() => setCreateVisible(false)}
      />
      <InvoiceDetailsDialog
        projectId={projectId}
        invoice={inspecting}
        currencyCode={currencyCode}
        onHide={() => setInspecting(null)}
        onPaid={setInspecting}
      />
    </div>
  )
}
