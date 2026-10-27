import dayjs from 'dayjs'
import { Dialog } from 'primereact/dialog'
import { formatCurrency } from '../../lib/format'
import type { PurchaseOrder } from './purchaseOrders.api'
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge'

interface PurchaseOrderDetailsDialogProps {
  order: PurchaseOrder | null
  currencyCode: string
  onHide: () => void
}

export function PurchaseOrderDetailsDialog({ order, currencyCode, onHide }: PurchaseOrderDetailsDialogProps) {
  const money = (amount: number) => formatCurrency(amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <Dialog
      header={order ? `Purchase Order ${order.poNumber}` : 'Purchase Order'}
      visible={order !== null}
      onHide={onHide}
      modal
      dismissableMask
      draggable={false}
      style={{ width: '40rem' }}
      className="form-dialog mx-4"
    >
      {order && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-semibold text-slate-900">{order.vendorName}</p>
              <p className="mt-1 text-sm text-slate-500">
                Issued {dayjs(order.issuedDate).format('MMM D, YYYY')}
                {order.deliveryDate && ` · Delivery ${dayjs(order.deliveryDate).format('MMM D, YYYY')}`}
              </p>
            </div>
            <PurchaseOrderStatusBadge status={order.status} />
          </div>

          <div className="overflow-x-auto rounded-md">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="bg-blue-50 text-[13px] font-semibold text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5">Quantity</th>
                  <th className="px-3 py-2.5">Unit Price</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {order.lineItems.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2.5">{line.description}</td>
                    <td className="px-3 py-2.5">{line.quantity}</td>
                    <td className="px-3 py-2.5">{money(line.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right">{money(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50">
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subtotal
                  </td>
                  <td className="px-3 py-3 text-right text-lg font-bold text-brand">{money(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.notes && (
            <div>
              <p className="text-[14px] font-medium text-slate-900">Note</p>
              <p className="log-info-box mt-1.5 whitespace-pre-wrap px-4 py-3 text-sm text-slate-700">{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
