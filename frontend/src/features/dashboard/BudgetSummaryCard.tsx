import { formatCurrency } from '../../lib/format'

interface BudgetSummaryCardProps {
  label: string
  amount: number
  currencyCode: string
  onOpenDetails: () => void
}

export function BudgetSummaryCard({ label, amount, currencyCode, onOpenDetails }: BudgetSummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
        {formatCurrency(amount, currencyCode)}
      </p>
      <button
        type="button"
        onClick={onOpenDetails}
        className="mt-4 text-sm font-semibold text-brand hover:underline"
      >
        Open Details
      </button>
    </div>
  )
}
