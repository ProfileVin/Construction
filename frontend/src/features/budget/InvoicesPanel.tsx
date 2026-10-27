import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { pagerTemplate } from '../../components/pagerTemplate'
import { formatCurrency } from '../../lib/format'
import { InvoiceStatusBadge } from '../invoices/InvoiceStatusBadge'
import { useInvoices } from './budget.hooks'
import type { Invoice } from './budget.api'

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-brand-ink">Recent Financial Invoices</h2>
        <p className="text-sm text-slate-500">Procurement orders &amp; material disbursements</p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <DataTable
          value={data?.items ?? []}
          loading={isLoading}
          emptyMessage="No invoices yet."
          className="app-table app-table--shaded min-w-[720px]"
          paginator
          lazy
          rows={PAGE_SIZE}
          first={(page - 1) * PAGE_SIZE}
          totalRecords={data?.totalCount ?? 0}
          onPage={(e) => setPage(Math.floor((e.first ?? 0) / PAGE_SIZE) + 1)}
          paginatorTemplate={pagerTemplate}
          paginatorLeft={
            data && data.totalCount > 0 ? (
              <span className="text-sm text-slate-600">
                Showing {showingCount} of {data.totalCount} invoices
              </span>
            ) : undefined
          }
        >
          <Column
            header="S.No"
            body={(_row: Invoice, opts) => opts.rowIndex + 1} // rowIndex already includes the page offset (BUG-006)
            style={{ width: '5rem' }}
            bodyClassName="text-center"
            headerClassName="app-table__center"
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
          <Column header="Status" body={(row: Invoice) => <InvoiceStatusBadge status={row.status} />} />
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
              <InvoiceStatusBadge status={selected.status} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
