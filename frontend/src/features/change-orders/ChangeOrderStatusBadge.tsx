import type { ChangeOrderStatus } from './changeOrders.api'
import { changeOrderStatusOptions } from './changeOrders.schema'

// Same palette as the PO / invoice badges; Rejected uses the app's red.
const STYLES: Record<ChangeOrderStatus, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-blue-100 text-blue-700',
  PendingOwnerApproval: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-red-100 text-red-700',
}

const changeOrderStatusLabel = (status: ChangeOrderStatus) =>
  changeOrderStatusOptions.find((o) => o.value === status)?.label ?? status

export function ChangeOrderStatusBadge({ status, className = '' }: { status: ChangeOrderStatus; className?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]} ${className}`}
    >
      {changeOrderStatusLabel(status)}
    </span>
  )
}
