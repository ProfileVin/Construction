import type { ProjectTaskStatus } from '../features/dashboard/dashboard.api'

const STYLES: Record<ProjectTaskStatus, string> = {
  Completed: 'bg-emerald-100 text-emerald-700',
  InProgress: 'bg-amber-100 text-amber-700',
  Upcoming: 'bg-blue-100 text-blue-700',
}

const LABELS: Record<ProjectTaskStatus, string> = {
  Completed: 'Completed',
  InProgress: 'In Progress',
  Upcoming: 'Upcoming',
}

interface StatusBadgeProps {
  status: ProjectTaskStatus
  label?: string
  /** Tighter padding and smaller type, for dense layouts such as the Schedule phase rows. */
  compact?: boolean
}

export function StatusBadge({ status, label, compact = false }: StatusBadgeProps) {
  const size = compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-block whitespace-nowrap rounded-full font-semibold ${size} ${STYLES[status]}`}>
      {label ?? LABELS[status]}
    </span>
  )
}
