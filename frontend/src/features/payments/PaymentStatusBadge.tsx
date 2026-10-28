import type { PaymentStatus } from './payments.api'

// Same colours as PurchaseOrderStatusBadge.
const STYLES: Record<PaymentStatus, string> = {
  Cleared: 'bg-emerald-100 text-emerald-700',
  Processing: 'bg-blue-100 text-blue-700',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
