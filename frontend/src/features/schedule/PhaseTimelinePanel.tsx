import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { SelectButton } from 'primereact/selectbutton'
import { useState } from 'react'
import { computeTimelineRange, buildDateScaleTicks } from './phaseTimeline.utils'
import { usePhases } from './schedule.hooks'
import { PhaseRow } from './PhaseRow'
import { NewMilestoneDialog } from './NewMilestoneDialog'

const ZOOM_OPTIONS = ['Day', 'Week', 'Month', 'Quarter']

interface PhaseTimelinePanelProps {
  projectId: string
  projectName: string
}

export function PhaseTimelinePanel({ projectId, projectName }: PhaseTimelinePanelProps) {
  const { data: phases, isLoading } = usePhases(projectId)
  const [zoom, setZoom] = useState('Week')
  const [dialogVisible, setDialogVisible] = useState(false)

  const range = computeTimelineRange(phases ?? [])
  const ticks = buildDateScaleTicks(range)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Construction Phases</h2>
          <p className="text-sm text-slate-500">Active critical path roadmap for {projectName}</p>
        </div>
        <div className="flex items-center gap-3">
          <SelectButton
            value={zoom}
            onChange={(e) => e.value && setZoom(e.value)}
            options={ZOOM_OPTIONS}
            className="schedule-zoom-toggle"
          />
          <Button label="New Milestone" icon="pi pi-plus" size="small" onClick={() => setDialogVisible(true)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <ProgressSpinner style={{ width: '32px', height: '32px' }} />
        </div>
      ) : phases && phases.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex justify-between border-b border-slate-100 pb-2 text-xs font-semibold text-slate-500">
            {ticks.map((tick, i) => (
              <span key={`${tick}-${i}`}>{tick}</span>
            ))}
          </div>

          {phases.map((phase, i) => (
            <PhaseRow key={phase.id} phase={phase} number={i + 1} range={range} />
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
