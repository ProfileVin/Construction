import { formatCurrency } from '../../lib/format'
import type { BudgetCategory } from './budget.api'

const PALETTE = ['bg-emerald-800', 'bg-emerald-600', 'bg-blue-800', 'bg-slate-500', 'bg-stone-400']

interface CategoryProgressRowProps {
  category: BudgetCategory
  colorIndex: number
  currencyCode: string
}

export function CategoryProgressRow({ category, colorIndex, currencyCode }: CategoryProgressRowProps) {
  const color = PALETTE[colorIndex % PALETTE.length]
  const percent =
    category.allocatedAmount > 0 ? Math.min(100, (category.spentAmount / category.allocatedAmount) * 100) : 0

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          {category.name}
        </span>
        <span className="text-sm text-slate-600">
          {formatCurrency(category.spentAmount, currencyCode, { maximumFractionDigits: 2 })} /{' '}
          {formatCurrency(category.allocatedAmount, currencyCode, { maximumFractionDigits: 2 })}{' '}
          <span className="text-slate-400">({percent.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-blue-50">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
