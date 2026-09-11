export function formatCurrency(
  amount: number,
  currencyCode: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount)
}
