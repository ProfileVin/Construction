import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InspectLink } from '../../components/InspectLink'
import { pagerTemplate } from '../../components/pagerTemplate'
import { formatCurrency } from '../../lib/format'
import type { ChangeOrder, PagedChangeOrders } from './changeOrders.api'
import { ChangeOrderStatusBadge } from './ChangeOrderStatusBadge'

interface ChangeOrdersTableProps {
  data: PagedChangeOrders | undefined
  isLoading: boolean
  page: number
  pageSize: number
  currencyCode: string
  onPageChange: (page: number) => void
  onInspect: (changeOrder: ChangeOrder) => void
}

export function ChangeOrdersTable({
  data,
  isLoading,
  page,
  pageSize,
  currencyCode,
  onPageChange,
  onInspect,
}: ChangeOrdersTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <DataTable
        value={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No change orders found."
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
              Showing {data.items.length} of {data.totalCount} change orders
            </span>
          ) : undefined
        }
      >
        <Column
          header="CO#"
          body={(row: ChangeOrder) => <span className="font-semibold text-slate-900">{row.coNumber}</span>}
          style={{ width: '7rem' }}
          bodyClassName="text-center"
          headerClassName="app-table__center"
        />
        <Column
          header="Description"
          body={(row: ChangeOrder) => (
            <span className="line-clamp-2 max-w-[16rem] text-[15px] text-slate-800" title={row.description}>
              {row.description}
            </span>
          )}
        />
        <Column
          header="Amount"
          body={(row: ChangeOrder) =>
            formatCurrency(row.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        />
        <Column header="Status" body={(row: ChangeOrder) => <ChangeOrderStatusBadge status={row.status} />} />
        <Column header="Date" body={(row: ChangeOrder) => dayjs(row.requestedDate).format('MMM D, YYYY')} />
        <Column
          header="Action"
          headerClassName="app-table__center"
          bodyClassName="text-center"
          style={{ width: '8rem' }}
          body={(row: ChangeOrder) => <InspectLink onClick={() => onInspect(row)} subject={row.coNumber} />}
        />
      </DataTable>
    </div>
  )
}
