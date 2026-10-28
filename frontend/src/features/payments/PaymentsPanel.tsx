import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { BudgetSummaryCard } from '../dashboard/BudgetSummaryCard'
import { PaymentDetailsDialog } from './PaymentDetailsDialog'
import { PaymentsTable } from './PaymentsTable'
import type { Payment, PaymentFilters, PaymentStatus } from './payments.api'
import { useDeletePayment, useMarkPaymentCleared, usePayments, usePaymentSummary } from './payments.hooks'
import { paymentStatusOptions } from './payments.schema'
import { RecordPaymentDialog } from './RecordPaymentDialog'

const PAGE_SIZE = 8

interface PaymentsPanelProps {
  projectId: string
  currencyCode: string
}

export function PaymentsPanel({ projectId, currencyCode }: PaymentsPanelProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [page, setPage] = useState(1)
  const [createVisible, setCreateVisible] = useState(false)
  const [viewing, setViewing] = useState<Payment | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filters: PaymentFilters = {
    search: search || undefined,
    status: status ?? undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = usePayments(projectId, filters)
  const { data: summary } = usePaymentSummary(projectId)
  const markCleared = useMarkPaymentCleared(projectId)
  const deletePayment = useDeletePayment(projectId)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const handleMarkCleared = async (payment: Payment) => {
    setActionError(null)
    try {
      await markCleared.mutateAsync(payment.id)
    } catch {
      setActionError(`Couldn't mark ${payment.paymentNumber} as cleared. Please try again.`)
    }
  }

  const handleDelete = (payment: Payment) =>
    confirmDialog({
      header: 'Delete payment',
      message: `Delete ${payment.paymentNumber}? This can't be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptClassName: 'p-button-danger',
      defaultFocus: 'reject',
      accept: async () => {
        setActionError(null)
        try {
          await deletePayment.mutateAsync(payment.id)
        } catch {
          setActionError(`Couldn't delete ${payment.paymentNumber}. Please try again.`)
        }
      },
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-brand-ink">Payments &amp; Disbursements</h1>
          <p className="mt-1 text-sm text-slate-600">Track inbound client payments and vendor disbursements.</p>
        </div>
        <Button label="Record Payment" icon="pi pi-plus" onClick={() => setCreateVisible(true)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BudgetSummaryCard
          label="Total Payment Received"
          amount={summary?.totalReceived ?? 0}
          currencyCode={currencyCode}
          fractionDigits={2}
          className="border border-slate-200"
        />
        <BudgetSummaryCard
          label="Payment Disbursed"
          amount={summary?.totalDisbursed ?? 0}
          currencyCode={currencyCode}
          fractionDigits={2}
          className="border border-slate-200"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="toolbar-band flex flex-wrap items-center gap-3 rounded-xl p-3">
          <span className="flat-search flex min-w-[220px] flex-1 items-center gap-2">
            <i className="pi pi-search text-slate-500" aria-hidden />
            <InputText
              value={search}
              onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
              placeholder="Search"
              aria-label="Search payments"
              className="w-full"
            />
          </span>
          <div className="w-full sm:w-64">
            <Dropdown
              value={status}
              options={paymentStatusOptions}
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

        <PaymentsTable
          data={data}
          isLoading={isLoading}
          page={page}
          pageSize={PAGE_SIZE}
          currencyCode={currencyCode}
          onPageChange={setPage}
          onView={setViewing}
          onMarkCleared={handleMarkCleared}
          onDelete={handleDelete}
        />
      </div>

      <RecordPaymentDialog projectId={projectId} visible={createVisible} onHide={() => setCreateVisible(false)} />
      <PaymentDetailsDialog payment={viewing} currencyCode={currencyCode} onHide={() => setViewing(null)} />
      <ConfirmDialog />
    </div>
  )
}
