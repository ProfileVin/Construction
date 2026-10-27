import { BUDGET_TABS, type BudgetTab } from './budget.tabs'

interface BudgetTabsProps {
  value: BudgetTab
  onChange: (tab: BudgetTab) => void
}

export function BudgetTabs({ value, onChange }: BudgetTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Budget & Finance sections"
      className="flex gap-1 overflow-x-auto rounded-xl border border-brand/40 bg-white p-1"
    >
      {BUDGET_TABS.map((tab) => {
        const active = value === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`flex min-w-[9rem] flex-1 shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-semibold transition-colors ${
              active ? 'bg-brand text-white' : 'text-slate-800 hover:bg-slate-50'
            }`}
          >
            {active && <i className={tab.icon} aria-hidden />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
