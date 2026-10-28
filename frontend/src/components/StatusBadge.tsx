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
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {label ?? LABELS[status]}
    </span>
  )
}
