import dayjs, { type Dayjs } from 'dayjs'
import type { ConstructionPhase } from './schedule.api'

export interface TimelineRange {
  start: Dayjs
  end: Dayjs
}

export function computeTimelineRange(phases: ConstructionPhase[]): TimelineRange {
  if (phases.length === 0) {
    const start = dayjs().startOf('day')
    return { start, end: start.add(90, 'day') }
  }

  const starts = phases.map((p) => dayjs(p.startDate))
  const ends = phases.map((p) => dayjs(p.endDate))
  const start = starts.reduce((min, d) => (d.isBefore(min) ? d : min))
  const end = ends.reduce((max, d) => (d.isAfter(max) ? d : max))

  // Pad both ends slightly so the first/last bars aren't flush against the track edge.
  const padDays = Math.max(1, Math.round(end.diff(start, 'day') * 0.05))
  return { start: start.subtract(padDays, 'day'), end: end.add(padDays, 'day') }
}

export interface PhaseBarMetrics {
  leftPercent: number
  widthPercent: number
}

export function getPhaseBarMetrics(phase: ConstructionPhase, range: TimelineRange): PhaseBarMetrics {
  const totalDays = range.end.diff(range.start, 'day') || 1
  const startOffsetDays = dayjs(phase.startDate).diff(range.start, 'day')
  const durationDays = dayjs(phase.endDate).diff(phase.startDate, 'day')

  const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalDays) * 100))
  const widthPercent = Math.max(2, Math.min(100 - leftPercent, (durationDays / totalDays) * 100))

  return { leftPercent, widthPercent }
}

export function buildDateScaleTicks(range: TimelineRange, tickCount = 4): string[] {
  const totalDays = range.end.diff(range.start, 'day')
  const step = totalDays / Math.max(1, tickCount - 1)

  return Array.from({ length: tickCount }, (_, i) =>
    range.start.add(Math.round(step * i), 'day').format('MMM D').toUpperCase(),
  )
}
