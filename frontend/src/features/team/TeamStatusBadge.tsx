import type { TeamMemberStatus } from './team.api'

const STYLES: Record<TeamMemberStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Deactivated: 'bg-slate-200 text-slate-600',
}

export function TeamStatusBadge({ status }: { status: TeamMemberStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
