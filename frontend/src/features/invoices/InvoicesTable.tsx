import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InspectLink } from '../../components/InspectLink'
import { pagerTemplate } from '../../components/pagerTemplate'
import { formatCurrency } from '../../lib/format'
import type { Invoice, PagedInvoices } from '../budget/budget.api'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'

interface InvoicesTableProps {
  data: PagedInvoices | undefined
  isLoading: boolean
  page: number
  pageSize: number
  currencyCode: string
  onPageChange: (page: number) => void
  onInspect: (invoice: Invoice) => void
}

export function InvoicesTable({
  data,
  isLoading,
  page,
  pageSize,
  currencyCode,
  onPageChange,
  onInspect,
}: InvoicesTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <DataTable
        value={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No invoices found."
        className="app-table app-table--shaded min-w-[860px]"
        paginator
        lazy
        rows={pageSize}
        first={(page - 1) * pageSize}
        totalRecords={data?.totalCount ?? 0}
        onPage={(e) => onPageChange(Math.floor((e.first ?? 0) / pageSize) + 1)}
        paginatorTemplate={pagerTemplate}
        paginatorLeft={
          data && data.totalCount > 0 ? (
            <span className="text-sm text-slate-600">
              Showing {data.items.length} of {data.totalCount} invoices
            </span>
          ) : undefined
        }
      >
        <Column
          header="INV#"
          body={(row: Invoice) => <span className="whitespace-nowrap font-semibold text-slate-900">{row.invoiceNumber}</span>}
          style={{ width: '9rem' }}
          bodyClassName="text-center"
          headerClassName="app-table__center"
        />
        <Column
          header="Vendor/Supplier"
          body={(row: Invoice) => (
            <span className="block max-w-[18rem] truncate text-[15px] text-slate-800" title={row.vendorName}>
              {row.vendorName}
            </span>
          )}
        />
        <Column
          header="Amount"
          body={(row: Invoice) =>
            formatCurrency(row.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        />
        <Column header="Status" body={(row: Invoice) => <InvoiceStatusBadge status={row.status} />} />
        <Column header="Issue Date" body={(row: Invoice) => dayjs(row.issuedDate).format('MMM D, YYYY')} />
        <Column
          header="Action"
          headerClassName="app-table__center"
          bodyClassName="text-center"
          style={{ width: '8rem' }}
          body={(row: Invoice) => <InspectLink onClick={() => onInspect(row)} subject={row.invoiceNumber} />}
        />
      </DataTable>
    </div>
  )
}
