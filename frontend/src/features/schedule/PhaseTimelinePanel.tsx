import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { SelectButton } from 'primereact/selectbutton'
import { useEffect, useRef, useState } from 'react'
import {
  buildTimelineTicks,
  computeTimelineRange,
  ZOOM_LEVELS,
  type TimelineTick,
  type ZoomLevel,
} from './phaseTimeline.utils'
import { usePhases } from './schedule.hooks'
import { PhaseRow } from './PhaseRow'
import { NewMilestoneDialog } from './NewMilestoneDialog'

// Rough half-width of a tick label ("SEP '26") plus a gap, used to keep labels clear of "Phase / Task".
const TICK_LABEL_HALF_WIDTH_PX = 32
// The band's `px-3` padding — room a right-most label may overflow into.
const BAND_INSET_PX = 12
// Horizontal room each visible label needs; decides how many ticks keep a label at the current width.
const TICK_SLOT_PX = 76

interface PhaseTimelinePanelProps {
  projectId: string
  projectName: string
}

export function PhaseTimelinePanel({ projectId, projectName }: PhaseTimelinePanelProps) {
  const { data: phases, isLoading } = usePhases(projectId)
  const [zoom, setZoom] = useState<ZoomLevel>('Month')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [axisWidth, setAxisWidth] = useState(0)

  const range = computeTimelineRange(phases ?? [], zoom)
  const maxLabels = axisWidth > 0 ? Math.floor(axisWidth / TICK_SLOT_PX) : 8
  const ticks = buildTimelineTicks(range, zoom, maxLabels)

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Construction Phases</h2>
          <p className="text-[13px] text-slate-500">Active critical path roadmap for {projectName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SelectButton
            value={zoom}
            onChange={(e) => e.value && setZoom(e.value as ZoomLevel)}
            options={[...ZOOM_LEVELS]}
            allowEmpty={false}
            className="schedule-zoom-toggle"
            aria-label="Timeline zoom"
          />
          <Button label="New Milestone" icon="pi pi-plus" size="small" onClick={() => setDialogVisible(true)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '32px', height: '32px' }} />
        </div>
      ) : phases && phases.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          <TimelineHeader ticks={ticks} onAxisResize={setAxisWidth} />

          {phases.map((phase, i) => (
            <PhaseRow key={phase.id} phase={phase} number={i + 1} range={range} ticks={ticks} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          No phases yet — add a milestone to start mapping the critical path.
        </p>
      )}

      <NewMilestoneDialog projectId={projectId} visible={dialogVisible} onHide={() => setDialogVisible(false)} />
    </div>
  )
}

/**
 * Blue axis band. Uses the same border + `px-3` inset as `PhaseRow`, so its tick track and the
 * rows' bar tracks share one geometry and labels sit directly above the dates they name.
 */
function TimelineHeader({ ticks, onAxisResize }: { ticks: TimelineTick[]; onAxisResize: (width: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState({ track: 0, caption: 0 })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => {
      setSize({ track: track.offsetWidth, caption: captionRef.current?.offsetWidth ?? 0 })
      onAxisResize(track.offsetWidth)
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [onAxisResize])

  // Skip labels that would collide with the "Phase / Task" caption or spill past the band's right edge.
  const fits = (tick: TimelineTick) => {
    const centerPx = ((tick.leftPercent + tick.widthPercent / 2) / 100) * size.track
    return (
      size.track > 0 &&
      centerPx - TICK_LABEL_HALF_WIDTH_PX > size.caption &&
      centerPx + TICK_LABEL_HALF_WIDTH_PX <= size.track + BAND_INSET_PX
    )
  }

  return (
    <div className="relative h-8 rounded-lg border border-transparent bg-blue-50 px-3">
      <span
        ref={captionRef}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wide whitespace-nowrap text-brand-ink uppercase"
      >
        Phase / Task
      </span>
      <div ref={trackRef} className="absolute inset-y-0 right-3 left-3">
        {ticks.map(
          (tick) =>
            tick.label &&
            fits(tick) && (
              <span
                key={tick.key}
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] whitespace-nowrap ${
                  tick.isCurrent ? 'font-bold text-brand-ink' : 'font-semibold text-slate-500'
                }`}
                style={{ left: `${tick.leftPercent + tick.widthPercent / 2}%` }}
              >
                {tick.label}
              </span>
            ),
        )}
      </div>
    </div>
  )
}
