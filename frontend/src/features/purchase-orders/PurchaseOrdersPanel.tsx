import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { BudgetSummaryCard } from '../dashboard/BudgetSummaryCard'
import { NewPurchaseOrderDialog } from './NewPurchaseOrderDialog'
import { PurchaseOrderDetailsDialog } from './PurchaseOrderDetailsDialog'
import { PurchaseOrdersTable } from './PurchaseOrdersTable'
import type { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderStatus } from './purchaseOrders.api'
import {
  useDeletePurchaseOrder,
  useMarkPurchaseOrderPaid,
  usePurchaseOrders,
  usePurchaseOrderSummary,
} from './purchaseOrders.hooks'
import { purchaseOrderStatusOptions } from './purchaseOrders.schema'

const PAGE_SIZE = 8

interface PurchaseOrdersPanelProps {
  projectId: string
  currencyCode: string
}

export function PurchaseOrdersPanel({ projectId, currencyCode }: PurchaseOrdersPanelProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PurchaseOrderStatus | null>(null)
  const [page, setPage] = useState(1)
  const [createVisible, setCreateVisible] = useState(false)
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filters: PurchaseOrderFilters = {
    search: search || undefined,
    status: status ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = usePurchaseOrders(projectId, filters)
  const { data: summary } = usePurchaseOrderSummary(projectId)
  const markPaid = useMarkPurchaseOrderPaid(projectId)
  const deleteOrder = useDeletePurchaseOrder(projectId)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const handleMarkPaid = async (order: PurchaseOrder) => {
    setActionError(null)
    try {
      await markPaid.mutateAsync(order.id)
    } catch {
      setActionError(`Couldn't mark ${order.poNumber} as paid. Please try again.`)
    }
  }

  const handleDelete = (order: PurchaseOrder) =>
    confirmDialog({
      header: 'Delete purchase order',
      message: `Delete ${order.poNumber}? This can't be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptClassName: 'p-button-danger',
      defaultFocus: 'reject',
      accept: async () => {
        setActionError(null)
        try {
          await deleteOrder.mutateAsync(order.id)
        } catch {
          setActionError(`Couldn't delete ${order.poNumber}. Please try again.`)
        }
      },
    })

  const kpis = [
    { label: 'Total Committed POs', amount: summary?.totalCommitted },
    { label: 'Pending Approvals', amount: summary?.pendingApprovals },
    { label: 'Disbursed To Date', amount: summary?.disbursedToDate },
    { label: 'Unallocated', amount: summary?.unallocated },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-brand-ink">Purchase Orders</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create and track purchase orders. Always check your available budget before issuing.
          </p>
        </div>
        <Button label="New Purchase Order" icon="pi pi-plus" onClick={() => setCreateVisible(true)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              aria-label="Search purchase orders"
              className="w-full"
            />
          </span>
          <div className="w-full sm:w-64">
            <Dropdown
              value={status}
              options={purchaseOrderStatusOptions}
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

        {actionError && (
          <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <PurchaseOrdersTable
          data={data}
          isLoading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          currencyCode={currencyCode}
          onPageChange={setPage}
          onView={setViewing}
          onMarkPaid={handleMarkPaid}
          onDelete={handleDelete}
        />
      </div>

      <NewPurchaseOrderDialog
        projectId={projectId}
        currencyCode={currencyCode}
        visible={createVisible}
        onHide={() => setCreateVisible(false)}
      />
      <PurchaseOrderDetailsDialog order={viewing} currencyCode={currencyCode} onHide={() => setViewing(null)} />
      <ConfirmDialog />
    </div>
  )
}
