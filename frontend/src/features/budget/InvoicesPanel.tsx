import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { formatCurrency } from '../../lib/format'
import { useInvoices } from './budget.hooks'
import type { Invoice } from './budget.api'

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-blue-100 text-blue-700',
}

const PAGE_SIZE = 8

interface InvoicesPanelProps {
  projectId: string
  currencyCode: string
}

export function InvoicesPanel({ projectId, currencyCode }: InvoicesPanelProps) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Invoice | null>(null)
  const { data, isLoading } = useInvoices(projectId, page, PAGE_SIZE)

  const showingCount = data ? Math.min(data.pageSize, data.items.length) : 0

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-brand-ink">Recent Financial Invoices</h2>
        <p className="text-sm text-slate-500">Procurement orders &amp; material disbursements</p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <DataTable
          value={data?.items ?? []}
          loading={isLoading}
          emptyMessage="No invoices yet."
          className="min-w-[720px]"
          paginator
          lazy
          rows={PAGE_SIZE}
          first={(page - 1) * PAGE_SIZE}
          totalRecords={data?.totalCount ?? 0}
          onPage={(e) => setPage(Math.floor((e.first ?? 0) / PAGE_SIZE) + 1)}
        >
          <Column
            header="S.No"
            body={(_row: Invoice, opts) => opts.rowIndex + 1} // rowIndex already includes the page offset (BUG-006)
            style={{ width: '4rem' }}
          />
          <Column
            header="Invoice / Vendor"
            body={(row: Invoice) => (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">{row.invoiceNumber}</span>
                <span className="text-xs text-slate-500">{row.vendorName}</span>
              </div>
            )}
          />
          <Column header="Category" body={(row: Invoice) => row.categoryName ?? '—'} />
          <Column
            header="Amount"
            body={(row: Invoice) => formatCurrency(row.amount, currencyCode, { maximumFractionDigits: 2 })}
          />
          <Column
            header="Status"
            body={(row: Invoice) => (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}>
                {row.status}
              </span>
            )}
          />
          <Column
            header="Action"
            body={(row: Invoice) => (
              <button
                type="button"
                onClick={() => setSelected(row)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                View Details
              </button>
            )}
          />
        </DataTable>
        {data && data.totalCount > 0 && (
          <p className="mt-2 text-sm text-slate-500">
            Showing {showingCount} of {data.totalCount} invoices
          </p>
        )}
      </div>

      <Dialog
        header="Invoice details"
        visible={selected !== null}
        onHide={() => setSelected(null)}
        modal
        dismissableMask
        style={{ width: '26rem' }}
        className="mx-4"
      >
        {selected && (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] font-semibold text-slate-800">{selected.invoiceNumber}</p>
            <p className="text-sm text-slate-500">
              {selected.vendorName} · {selected.categoryName ?? 'No category'}
            </p>
            <p className="text-sm text-slate-500">
              {formatCurrency(selected.amount, currencyCode, { maximumFractionDigits: 2 })} · Issued{' '}
              {dayjs(selected.issuedDate).format('MMM D, YYYY')}
            </p>
            <div className="mt-1">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[selected.status]}`}>
                {selected.status}
              </span>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
