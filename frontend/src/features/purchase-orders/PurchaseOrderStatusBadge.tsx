import type { PurchaseOrderStatus } from './purchaseOrders.api'

// Same colours as the invoice badges (InvoicesPanel).
const STYLES: Record<PurchaseOrderStatus, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-blue-100 text-blue-700',
}

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
