import dayjs from 'dayjs'
import { StatusBadge } from '../../components/StatusBadge'
import { getPhaseBarMetrics, type TimelineRange, type TimelineTick } from './phaseTimeline.utils'
import type { ConstructionPhase, PhaseStatus } from './schedule.api'

// Segment base colour and label colour per status (mockup: dark green / amber / pale blue).
const SEGMENT_STYLES: Record<PhaseStatus, string> = {
  Completed: 'bg-brand text-white',
  InProgress: 'bg-amber-100 text-amber-900',
  Upcoming: 'bg-blue-200 text-slate-700',
}

interface PhaseRowProps {
  phase: ConstructionPhase
  number: number
  range: TimelineRange
  ticks: TimelineTick[]
}

export function PhaseRow({ phase, number, range, ticks }: PhaseRowProps) {
  const { leftPercent, widthPercent } = getPhaseBarMetrics(phase, range)
  const badgeLabel =
    phase.status === 'Upcoming' ? undefined : `${phase.percentComplete}% ${phase.status === 'Completed' ? 'Completed' : 'In Progress'}`
  const barLabel =
    phase.checkpointLabel && phase.status === 'Upcoming' && phase.percentComplete > 0
      ? `${phase.checkpointLabel} (${phase.percentComplete}%)`
      : phase.checkpointLabel

  return (
    <div className="rounded-lg border border-slate-100 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-[15px] font-bold text-brand-ink">
          {number}. {phase.name}
        </h3>
        <div className="flex items-center gap-3">
          <StatusBadge status={phase.status} label={badgeLabel} compact />
          <span className="whitespace-nowrap text-sm text-slate-700">
            {dayjs(phase.startDate).format('DD MMM')} – {dayjs(phase.endDate).format('DD MMM')}
          </span>
        </div>
      </div>

      <div className="relative mt-2.5 h-7 w-full overflow-hidden rounded-md bg-blue-100/60">
        {ticks
          .filter((tick) => tick.label && tick.leftPercent > 0)
          .map((tick) => (
            <div key={tick.key} className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${tick.leftPercent}%` }} />
          ))}
        <div
          className={`absolute inset-y-0 overflow-hidden rounded-md ${SEGMENT_STYLES[phase.status]}`}
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
        >
          {phase.status === 'InProgress' && (
            <div className="absolute inset-y-0 left-0 bg-amber-200" style={{ width: `${phase.percentComplete}%` }} />
          )}
          {barLabel && (
            <div className="relative flex h-full items-center px-2.5 text-[11px] font-semibold" title={barLabel}>
              <span className="truncate">{barLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
