import dayjs, { type Dayjs } from 'dayjs'
import type { ConstructionPhase } from './schedule.api'

export const ZOOM_LEVELS = ['Day', 'Week', 'Month', 'Quarter'] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]

export interface TimelineRange {
  start: Dayjs
  /** Exclusive — the start of the unit after the last phase ends. */
  end: Dayjs
}

// Quarters are computed by hand so we don't pull in dayjs's QuarterOfYear plugin.
function startOfUnit(d: Dayjs, zoom: ZoomLevel): Dayjs {
  switch (zoom) {
    case 'Day':
      return d.startOf('day')
    case 'Week':
      return d.startOf('week')
    case 'Month':
      return d.startOf('month')
    case 'Quarter':
      return d.month(Math.floor(d.month() / 3) * 3).startOf('month')
  }
}

function addUnit(d: Dayjs, zoom: ZoomLevel, n: number): Dayjs {
  switch (zoom) {
    case 'Day':
      return d.add(n, 'day')
    case 'Week':
      return d.add(n, 'week')
    case 'Month':
      return d.add(n, 'month')
    case 'Quarter':
      return d.add(n * 3, 'month')
  }
}

function formatUnitLabel(d: Dayjs, zoom: ZoomLevel): string {
  switch (zoom) {
    case 'Day':
    case 'Week':
      return d.format('MMM D').toUpperCase()
    case 'Month':
      return d.format("MMM 'YY").toUpperCase()
    case 'Quarter':
      return `Q${Math.floor(d.month() / 3) + 1} ${d.year()}`
  }
}

/** Timeline spanning every phase, snapped outward to whole zoom units. */
export function computeTimelineRange(phases: ConstructionPhase[], zoom: ZoomLevel): TimelineRange {
  let first: Dayjs
  let last: Dayjs

  if (phases.length === 0) {
    first = dayjs().startOf('day')
    last = first.add(90, 'day')
  } else {
    const starts = phases.map((p) => dayjs(p.startDate))
    const ends = phases.map((p) => dayjs(p.endDate))
    first = starts.reduce((min, d) => (d.isBefore(min) ? d : min))
    last = ends.reduce((max, d) => (d.isAfter(max) ? d : max))
  }

  // Day units are narrow enough that bars would touch the track edges — give them a day of air.
  if (zoom === 'Day') {
    first = first.subtract(1, 'day')
    last = last.add(1, 'day')
  }

  return { start: startOfUnit(first, zoom), end: addUnit(startOfUnit(last, zoom), zoom, 1) }
}

export interface PhaseBarMetrics {
  leftPercent: number
  widthPercent: number
}

export function getPhaseBarMetrics(phase: ConstructionPhase, range: TimelineRange): PhaseBarMetrics {
  const totalDays = range.end.diff(range.start, 'day') || 1
  const startOffsetDays = dayjs(phase.startDate).diff(range.start, 'day')
  // End dates are inclusive: a phase from the 1st to the 23rd covers 23 days.
  const durationDays = dayjs(phase.endDate).diff(phase.startDate, 'day') + 1

  const leftPercent = Math.max(0, Math.min(100, (startOffsetDays / totalDays) * 100))
  const widthPercent = Math.max(2, Math.min(100 - leftPercent, (durationDays / totalDays) * 100))

  return { leftPercent, widthPercent }
}

export interface TimelineTick {
  key: string
  /** Null when the tick is thinned out (no label, no gridline) so labels don't crowd. */
  label: string | null
  leftPercent: number
  widthPercent: number
  isCurrent: boolean
}

/**
 * One tick per zoom unit in the range, positioned on the same axis as the phase bars.
 * Only every n-th tick keeps its label so at most `maxLabels` are shown.
 */
export function buildTimelineTicks(range: TimelineRange, zoom: ZoomLevel, maxLabels: number): TimelineTick[] {
  const totalDays = range.end.diff(range.start, 'day') || 1
  const today = dayjs()
  const units: { start: Dayjs; end: Dayjs }[] = []

  for (let d = range.start; d.isBefore(range.end); d = addUnit(d, zoom, 1)) {
    units.push({ start: d, end: addUnit(d, zoom, 1) })
  }

  const labelStride = Math.ceil(units.length / Math.max(1, maxLabels))

  return units.map(({ start, end }, i) => ({
    key: start.format('YYYY-MM-DD'),
    label: i % labelStride === 0 ? formatUnitLabel(start, zoom) : null,
    leftPercent: (start.diff(range.start, 'day') / totalDays) * 100,
    widthPercent: (end.diff(start, 'day') / totalDays) * 100,
    isCurrent: !today.isBefore(start) && today.isBefore(end),
  }))
}
