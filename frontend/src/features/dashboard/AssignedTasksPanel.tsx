import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjectTasks } from './dashboard.hooks'
import { NewTaskDialog } from './NewTaskDialog'
import { TaskDetailsDialog } from './TaskDetailsDialog'
import type { ProjectTask } from './dashboard.api'

interface AssignedTasksPanelProps {
  projectId: string
}

export function AssignedTasksPanel({ projectId }: AssignedTasksPanelProps) {
  const { data: tasks, isLoading } = useProjectTasks(projectId)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [selected, setSelected] = useState<ProjectTask | null>(null)

  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Assigned Tasks</h2>
        <Button label="New Task" icon="pi pi-plus" size="small" onClick={() => setDialogVisible(true)} />
      </div>

      <div className="mt-3 overflow-x-auto">
        <DataTable
          value={tasks ?? []}
          loading={isLoading}
          emptyMessage="No tasks yet — create one to get started."
          className="dash-table min-w-[480px]"
        >
          <Column
            header="S.No"
            body={(_row: ProjectTask, opts) => opts.rowIndex + 1}
            className="dash-table__center"
            headerClassName="dash-table__center"
            style={{ width: '3rem' }}
          />
          {/* The fixed columns leave no room for an Action column (FEAT-017), so the title opens the details. */}
          <Column
            header="Task"
            body={(row: ProjectTask) => (
              <button
                type="button"
                onClick={() => setSelected(row)}
                title={row.title}
                className="block w-full cursor-pointer truncate text-left hover:text-sky-900 hover:underline"
              >
                {row.title}
              </button>
            )}
          />
          <Column
            header="Assignee"
            body={(row: ProjectTask) => <span title={row.assigneeName}>{row.assigneeName}</span>}
            style={{ width: '7.5rem' }}
          />
          <Column
            header={<span className="sr-only">Team</span>}
            body={(row: ProjectTask) => (
              <Link to="/team" aria-label={`View ${row.assigneeName} in Team`} className="dash-link">
                <i className="pi pi-external-link text-xs" />
              </Link>
            )}
            style={{ width: '1.75rem', paddingLeft: 0, paddingRight: 0 }}
          />
          <Column
            header="Assigned Date"
            body={(row: ProjectTask) => dayjs(row.assignedDate).format('DD/MM/YYYY')}
            style={{ width: '6.25rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
          />
          <Column
            header="Deadline"
            body={(row: ProjectTask) => dayjs(row.deadline).format('DD/MM/YYYY')}
            style={{ width: '6.25rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
          />
        </DataTable>
      </div>

      <NewTaskDialog projectId={projectId} visible={dialogVisible} onHide={() => setDialogVisible(false)} />
      <TaskDetailsDialog task={selected} onHide={() => setSelected(null)} />
    </div>
  )
}
