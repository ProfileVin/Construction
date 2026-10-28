import type { InvoiceStatus } from '../budget/budget.api'

const STYLES: Record<InvoiceStatus, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-blue-100 text-blue-700',
  Scheduled: 'bg-amber-100 text-amber-700',
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
