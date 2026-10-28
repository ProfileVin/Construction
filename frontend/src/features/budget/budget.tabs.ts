export const BUDGET_TABS = [
  { value: 'overview', label: 'Overview', icon: 'pi pi-clipboard' },
  { value: 'purchase-orders', label: 'Purchase Order', icon: 'pi pi-shopping-cart' },
  { value: 'change-orders', label: 'Change Order', icon: 'pi pi-sync' },
  { value: 'invoices', label: 'Invoice', icon: 'pi pi-file' },
  { value: 'payments', label: 'Payment', icon: 'pi pi-credit-card' },
  { value: 'reports', label: 'Reports', icon: 'pi pi-chart-bar' },
] as const

export type BudgetTab = (typeof BUDGET_TABS)[number]['value']

export function isBudgetTab(value: string | null): value is BudgetTab {
  return BUDGET_TABS.some((tab) => tab.value === value)
}
