import dayjs from 'dayjs'
import { StatusBadge } from '../../components/StatusBadge'
import { getPhaseBarMetrics, type TimelineRange } from './phaseTimeline.utils'
import type { ConstructionPhase } from './schedule.api'

interface PhaseRowProps {
  phase: ConstructionPhase
  number: number
  range: TimelineRange
}

export function PhaseRow({ phase, number, range }: PhaseRowProps) {
  const { leftPercent, widthPercent } = getPhaseBarMetrics(phase, range)
  const badgeLabel =
    phase.status === 'Upcoming' ? undefined : `${phase.percentComplete}% ${phase.status === 'Completed' ? 'Completed' : 'In Progress'}`

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-slate-900">
          {number}. {phase.name}
        </h3>
        <div className="flex items-center gap-3">
          <StatusBadge status={phase.status} label={badgeLabel} />
          <span className="whitespace-nowrap text-sm text-slate-500">
            {dayjs(phase.startDate).format('DD MMM')} – {dayjs(phase.endDate).format('DD MMM')}
          </span>
        </div>
      </div>

      <div className="relative mt-3 h-9 w-full">
        <div
          className="absolute inset-y-0 overflow-hidden rounded-lg"
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        >
          <div className="absolute inset-0 bg-blue-100" />
          <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${phase.percentComplete}%` }} />
          {phase.checkpointLabel && (
            <div
              className={`relative flex h-full items-center px-3 text-xs font-semibold ${
                phase.percentComplete >= 20 ? 'text-white' : 'text-brand-ink'
              }`}
            >
              <span className="truncate">{phase.checkpointLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
