import { formatCurrency } from '../../lib/format'

interface BudgetSummaryCardProps {
  label: string
  amount: number
  currencyCode: string
  onOpenDetails: () => void
  badge?: { label: string; tone: 'positive' | 'negative' }
}

const BADGE_STYLES: Record<'positive' | 'negative', string> = {
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-red-100 text-red-700',
}

export function BudgetSummaryCard({ label, amount, currencyCode, onOpenDetails, badge }: BudgetSummaryCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-brand-ink sm:text-4xl">
        {formatCurrency(amount, currencyCode)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        {badge && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[badge.tone]}`}>
            {badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenDetails}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Open Details
        </button>
      </div>
    </div>
  )
}
