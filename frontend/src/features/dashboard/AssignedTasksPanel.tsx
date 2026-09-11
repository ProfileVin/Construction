import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjectTasks } from './dashboard.hooks'
import { NewTaskDialog } from './NewTaskDialog'
import type { ProjectTask } from './dashboard.api'

interface AssignedTasksPanelProps {
  projectId: string
}

export function AssignedTasksPanel({ projectId }: AssignedTasksPanelProps) {
  const { data: tasks, isLoading } = useProjectTasks(projectId)
  const [dialogVisible, setDialogVisible] = useState(false)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-ink">Assigned Tasks</h2>
        <Button label="New Task" icon="pi pi-plus" size="small" onClick={() => setDialogVisible(true)} />
      </div>

      <div className="mt-4 overflow-x-auto">
        <DataTable
          value={tasks ?? []}
          loading={isLoading}
          emptyMessage="No tasks yet — create one to get started."
          className="min-w-[560px]"
        >
          <Column header="S.No" body={(_row: ProjectTask, opts) => opts.rowIndex + 1} style={{ width: '4rem' }} />
          <Column field="title" header="Task" />
          <Column
            header="Assignee"
            body={(row: ProjectTask) => (
              <span className="flex items-center gap-2">
                {row.assigneeName}
                <Link to="/team" aria-label="View team" className="text-slate-400 hover:text-brand">
                  <i className="pi pi-external-link text-xs" />
                </Link>
              </span>
            )}
          />
          <Column
            header="Assigned Date"
            body={(row: ProjectTask) => dayjs(row.assignedDate).format('DD/MM/YYYY')}
          />
          <Column header="Deadline" body={(row: ProjectTask) => dayjs(row.deadline).format('DD/MM/YYYY')} />
        </DataTable>
      </div>

      <NewTaskDialog projectId={projectId} visible={dialogVisible} onHide={() => setDialogVisible(false)} />
    </div>
  )
}
