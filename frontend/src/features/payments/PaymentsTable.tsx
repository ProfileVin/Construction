import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Menu } from 'primereact/menu'
import type { MenuItem } from 'primereact/menuitem'
import { useRef, useState } from 'react'
import { pagerTemplate } from '../../components/pagerTemplate'
import { formatCurrency } from '../../lib/format'
import type { PagedPayments, Payment } from './payments.api'
import { DIRECTION_LABELS, METHOD_LABELS } from './payments.schema'
import { PaymentStatusBadge } from './PaymentStatusBadge'

interface PaymentsTableProps {
  data: PagedPayments | undefined
  isLoading: boolean
  page: number
  pageSize: number
  currencyCode: string
  onPageChange: (page: number) => void
  onView: (payment: Payment) => void
  onMarkCleared: (payment: Payment) => void
  onDelete: (payment: Payment) => void
}

export function PaymentsTable({
  data,
  isLoading,
  page,
  pageSize,
  currencyCode,
  onPageChange,
  onView,
  onMarkCleared,
  onDelete,
}: PaymentsTableProps) {
  // One popup menu shared by every row; `menuPayment` is the row it was opened for.
  const menuRef = useRef<Menu>(null)
  const [menuPayment, setMenuPayment] = useState<Payment | null>(null)
  const menuItems: MenuItem[] = [
    { label: 'Mark as Cleared', icon: 'pi pi-check-circle', command: () => menuPayment && onMarkCleared(menuPayment) },
    { label: 'Delete', icon: 'pi pi-trash', className: 'po-menu-danger', command: () => menuPayment && onDelete(menuPayment) },
  ]

  return (
    <div className="mt-4 overflow-x-auto">
      <DataTable
        value={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No payments found."
        className="app-table app-table--shaded min-w-[960px]"
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
              Showing {data.items.length} of {data.totalCount} payments
            </span>
          ) : undefined
        }
      >
        <Column
          header="REF#"
          body={(row: Payment) => <span className="font-semibold text-slate-900">{row.paymentNumber}</span>}
          style={{ width: '7rem' }}
          bodyClassName="text-center"
          headerClassName="app-table__center"
        />
        <Column
          header="Payer/Payee"
          body={(row: Payment) => (
            <span className="line-clamp-2 max-w-[12rem] text-[15px] text-slate-800" title={row.partyName}>
              {row.partyName}
            </span>
          )}
        />
        <Column header="Inbound/Outbound" body={(row: Payment) => DIRECTION_LABELS[row.direction]} />
        <Column header="Payment Method" body={(row: Payment) => METHOD_LABELS[row.method]} />
        <Column header="Payment Date" body={(row: Payment) => dayjs(row.paymentDate).format('MMM D, YYYY')} />
        <Column
          header="Amount"
          body={(row: Payment) =>
            formatCurrency(row.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        />
        <Column header="Status" body={(row: Payment) => <PaymentStatusBadge status={row.status} />} />
        <Column
          header="Action"
          headerClassName="app-table__center"
          style={{ width: '7rem' }}
          body={(row: Payment) => (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onView(row)}
                aria-label={`View ${row.paymentNumber}`}
                title="View details"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 hover:text-brand"
              >
                <i className="pi pi-file" aria-hidden />
              </button>
              {row.status === 'Processing' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuPayment(row)
                    menuRef.current?.toggle(e)
                  }}
                  aria-label={`More actions for ${row.paymentNumber}`}
                  aria-haspopup="menu"
                  title="More actions"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
                >
                  <i className="pi pi-ellipsis-v" aria-hidden />
                </button>
              ) : (
                // Cleared payments have no actions; keep the column aligned.
                <span className="h-8 w-8" aria-hidden />
              )}
            </div>
          )}
        />
      </DataTable>
      <Menu ref={menuRef} model={menuItems} popup />
    </div>
  )
}
