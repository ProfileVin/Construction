import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { openBlobInNewTab } from '../../lib/download'
import { formatCurrency } from '../../lib/format'
import type { Invoice } from '../budget/budget.api'
import { fetchDocumentContent } from '../documents/documents.api'
import { useMarkInvoicePaid } from './invoices.hooks'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'

interface InvoiceDetailsDialogProps {
  projectId: string
  invoice: Invoice | null
  currencyCode: string
  onHide: () => void
  /** Called with the updated invoice, so the dialog can show the new status. */
  onPaid: (invoice: Invoice) => void
}

export function InvoiceDetailsDialog({ projectId, invoice, currencyCode, onHide, onPaid }: InvoiceDetailsDialogProps) {
  const markPaid = useMarkInvoicePaid(projectId)
  const [receiptError, setReceiptError] = useState(false)

  const close = () => {
    if (markPaid.isPending) return
    markPaid.reset()
    setReceiptError(false)
    onHide()
  }

  const openReceipt = async (i: Invoice) => {
    setReceiptError(false)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(i.projectId, i.receiptDocumentId as string, false))
    } catch {
      setReceiptError(true)
    }
  }

  const submitPaid = async (i: Invoice) => {
    try {
      onPaid(await markPaid.mutateAsync(i.id))
    } catch {
      // Shown below via markPaid.isError.
    }
  }

  return (
    <Dialog
      header={invoice ? `Invoice ${invoice.invoiceNumber}` : 'Invoice'}
      visible={invoice !== null}
      onHide={close}
      modal
      dismissableMask={!markPaid.isPending}
      closable={!markPaid.isPending}
      draggable={false}
      style={{ width: '34rem' }}
      className="form-dialog mx-4"
    >
      {invoice && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[17px] font-semibold text-slate-900">{invoice.vendorName}</p>
              <p className="mt-1 text-sm text-slate-500">
                {invoice.categoryName ?? 'No category'} · Issued {dayjs(invoice.issuedDate).format('MMM D, YYYY')}
              </p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div className="flex items-baseline justify-between rounded-md bg-blue-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</span>
            <span className="text-lg font-bold text-brand">
              {formatCurrency(invoice.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-[14px] font-medium text-slate-900">Notes</p>
              <p className="log-info-box mt-1.5 whitespace-pre-wrap px-4 py-3 text-sm text-slate-700">{invoice.notes}</p>
            </div>
          )}

          {invoice.receiptDocumentId && (
            <button
              type="button"
              onClick={() => openReceipt(invoice)}
              className="dash-link inline-flex items-center gap-1.5 self-start text-sm font-medium"
            >
              <i className="pi pi-paperclip text-xs" aria-hidden />
              Open receipt
            </button>
          )}
          {receiptError && (
            <p role="alert" className="text-sm text-red-600">
              Couldn’t open the receipt. Please try again.
            </p>
          )}

          {markPaid.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              Couldn’t mark {invoice.invoiceNumber} as paid. Please try again.
            </div>
          )}

          {invoice.status !== 'Paid' && (
            <div className="form-dialog-actions mt-1 flex justify-end">
              <Button
                type="button"
                label="Mark as Paid"
                icon="pi pi-check-circle"
                onClick={() => submitPaid(invoice)}
                loading={markPaid.isPending}
              />
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
