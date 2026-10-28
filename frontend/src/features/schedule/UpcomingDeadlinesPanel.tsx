import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useMemo, useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { useProjectTasks } from '../dashboard/dashboard.hooks'
import { NewTaskDialog } from '../dashboard/NewTaskDialog'
import { TaskDetailsDialog } from '../dashboard/TaskDetailsDialog'
import type { ProjectTask } from '../dashboard/dashboard.api'

interface UpcomingDeadlinesPanelProps {
  projectId: string
}

export function UpcomingDeadlinesPanel({ projectId }: UpcomingDeadlinesPanelProps) {
  const { data: tasks, isLoading } = useProjectTasks(projectId)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [selected, setSelected] = useState<ProjectTask | null>(null)

  const sortedTasks = useMemo(
    () => [...(tasks ?? [])].sort((a, b) => dayjs(a.deadline).diff(dayjs(b.deadline))),
    [tasks],
  )

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Upcoming Deadlines</h2>
          <p className="text-sm text-slate-500">Milestone checkpoints &amp; closeouts</p>
        </div>
        <Button label="New Task" icon="pi pi-plus" size="small" onClick={() => setDialogVisible(true)} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <DataTable
          value={sortedTasks}
          loading={isLoading}
          emptyMessage="No tasks yet — create one to get started."
          className="min-w-[640px]"
        >
          <Column header="S.No" body={(_row: ProjectTask, opts) => opts.rowIndex + 1} style={{ width: '4rem' }} />
          <Column
            header="Milestone/Task"
            body={(row: ProjectTask) => (
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">{row.title}</span>
                <span className="text-xs text-slate-500">{row.phaseName ? `${row.phaseName} Phase` : '—'}</span>
              </div>
            )}
          />
          <Column header="Due Date" body={(row: ProjectTask) => dayjs(row.deadline).format('DD/MM/YYYY')} />
          <Column header="Status" body={(row: ProjectTask) => <StatusBadge status={row.status} />} />
          <Column
            header="Action"
            body={(row: ProjectTask) => (
              <button
                type="button"
                onClick={() => setSelected(row)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                View Details
              </button>
            )}
          />
        </DataTable>
      </div>

      <NewTaskDialog projectId={projectId} visible={dialogVisible} onHide={() => setDialogVisible(false)} />
      <TaskDetailsDialog task={selected} onHide={() => setSelected(null)} />
    </div>
  )
}
