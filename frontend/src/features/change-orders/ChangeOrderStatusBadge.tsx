import type { ChangeOrderStatus } from './changeOrders.api'

// Same palette as the PO / invoice badges; Rejected uses the app's red.
const STYLES: Record<ChangeOrderStatus, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
}

export function ChangeOrderStatusBadge({ status }: { status: ChangeOrderStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
