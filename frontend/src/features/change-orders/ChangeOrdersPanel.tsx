import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { BudgetSummaryCard } from '../dashboard/BudgetSummaryCard'
import { ChangeOrderDetailsDialog } from './ChangeOrderDetailsDialog'
import { ChangeOrdersTable } from './ChangeOrdersTable'
import type { ChangeOrder, ChangeOrderFilters, ChangeOrderStatus } from './changeOrders.api'
import { useChangeOrders, useChangeOrderSummary } from './changeOrders.hooks'
import { changeOrderStatusOptions } from './changeOrders.schema'
import { NewChangeOrderDialog } from './NewChangeOrderDialog'

const PAGE_SIZE = 8

interface ChangeOrdersPanelProps {
  projectId: string
  currencyCode: string
}

export function ChangeOrdersPanel({ projectId, currencyCode }: ChangeOrdersPanelProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ChangeOrderStatus | null>(null)
  const [page, setPage] = useState(1)
  const [createVisible, setCreateVisible] = useState(false)
  const [inspecting, setInspecting] = useState<ChangeOrder | null>(null)

  const filters: ChangeOrderFilters = {
    search: search || undefined,
    status: status ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = useChangeOrders(projectId, filters)
  const { data: summary } = useChangeOrderSummary(projectId)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const kpis = [
    { label: 'Total Change Order', amount: summary?.totalChangeOrders },
    { label: 'Pending Approvals', amount: summary?.pendingApprovals },
    { label: 'Approved', amount: summary?.approved },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-brand-ink">Change Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit and approve change orders. All approved changes update schedule and billing automatically.
          </p>
        </div>
        <Button label="New Change Order" icon="pi pi-plus" onClick={() => setCreateVisible(true)} />
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
              aria-label="Search change orders"
              className="w-full"
            />
          </span>
          <div className="w-full sm:w-64">
            <Dropdown
              value={status}
              options={changeOrderStatusOptions}
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

        <ChangeOrdersTable
          data={data}
          isLoading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          currencyCode={currencyCode}
          onPageChange={setPage}
          onInspect={setInspecting}
        />
      </div>

      <NewChangeOrderDialog projectId={projectId} visible={createVisible} onHide={() => setCreateVisible(false)} />
      <ChangeOrderDetailsDialog
        projectId={projectId}
        changeOrder={inspecting}
        currencyCode={currencyCode}
        onHide={() => setInspecting(null)}
        onDecided={setInspecting}
      />
    </div>
  )
}
