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

/** Compact size label, e.g. `42.3MB` / `812KB`. */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1
  return `${value.toFixed(digits)}${units[unit]}`
}

/** "Site Admin" → "SA"; used for initials avatars. */
export function initials(fullName: string | undefined): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
