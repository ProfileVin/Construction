import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Menu } from 'primereact/menu'
import type { MenuItem } from 'primereact/menuitem'
import { useRef, useState } from 'react'
import { pagerTemplate } from '../../components/pagerTemplate'
import { formatCurrency } from '../../lib/format'
import type { PagedPurchaseOrders, PurchaseOrder } from './purchaseOrders.api'
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge'

interface PurchaseOrdersTableProps {
  data: PagedPurchaseOrders | undefined
  isLoading: boolean
  page: number
  pageSize: number
  currencyCode: string
  onPageChange: (page: number) => void
  onView: (order: PurchaseOrder) => void
  onMarkPaid: (order: PurchaseOrder) => void
  onDelete: (order: PurchaseOrder) => void
}

export function PurchaseOrdersTable({
  data,
  isLoading,
  page,
  pageSize,
  currencyCode,
  onPageChange,
  onView,
  onMarkPaid,
  onDelete,
}: PurchaseOrdersTableProps) {
  // One popup menu shared by every row; `menuOrder` is the row it was opened for.
  const menuRef = useRef<Menu>(null)
  const [menuOrder, setMenuOrder] = useState<PurchaseOrder | null>(null)
  const menuItems: MenuItem[] = [
    { label: 'Mark as Paid', icon: 'pi pi-check-circle', command: () => menuOrder && onMarkPaid(menuOrder) },
    { label: 'Delete', icon: 'pi pi-trash', className: 'po-menu-danger', command: () => menuOrder && onDelete(menuOrder) },
  ]

  return (
    <div className="mt-4 overflow-x-auto">
      <DataTable
        value={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No purchase orders found."
        className="app-table app-table--shaded min-w-[900px]"
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
              Showing {data.items.length} of {data.totalCount} purchase orders
            </span>
          ) : undefined
        }
      >
        <Column
          header="PO#"
          body={(row: PurchaseOrder) => <span className="font-semibold text-slate-900">{row.poNumber}</span>}
          style={{ width: '7rem' }}
          bodyClassName="text-center"
          headerClassName="app-table__center"
        />
        <Column
          header="Vendor/Supplier"
          body={(row: PurchaseOrder) => (
            <div className="flex max-w-[18rem] flex-col gap-1">
              <span className="truncate text-[15px] text-slate-800" title={row.vendorName}>
                {row.vendorName}
              </span>
              <span className="truncate text-xs text-slate-500" title={row.itemSummary}>
                {row.itemSummary}
              </span>
            </div>
          )}
        />
        <Column
          header="Amount"
          body={(row: PurchaseOrder) =>
            formatCurrency(row.totalAmount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        />
        <Column header="Status" body={(row: PurchaseOrder) => <PurchaseOrderStatusBadge status={row.status} />} />
        <Column header="Issue Date" body={(row: PurchaseOrder) => dayjs(row.issuedDate).format('MMM D, YYYY')} />
        <Column
          header="Action"
          headerClassName="app-table__center"
          style={{ width: '7rem' }}
          body={(row: PurchaseOrder) => (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onView(row)}
                aria-label={`View ${row.poNumber}`}
                title="View details"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 hover:text-brand"
              >
                <i className="pi pi-eye" aria-hidden />
              </button>
              {row.status === 'Pending' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOrder(row)
                    menuRef.current?.toggle(e)
                  }}
                  aria-label={`More actions for ${row.poNumber}`}
                  aria-haspopup="menu"
                  title="More actions"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
                >
                  <i className="pi pi-ellipsis-v" aria-hidden />
                </button>
              ) : (
                // Paid POs have no actions; keep the column aligned.
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
