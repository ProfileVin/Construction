import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import type { ProjectTask } from '../dashboard/dashboard.api'
import type { PagedTasks } from './taskLog.api'
import { TaskLogDetailsDialog } from './TaskLogDetailsDialog'

interface TaskLogTableProps {
  data: PagedTasks | undefined
  isLoading: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function TaskLogTable({ data, isLoading, page, pageSize, onPageChange }: TaskLogTableProps) {
  const [selected, setSelected] = useState<ProjectTask | null>(null)

  return (
    <div className="mt-4 overflow-x-auto">
      <DataTable
        value={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No tasks match these filters."
        className="min-w-[720px]"
        paginator
        lazy
        rows={pageSize}
        first={(page - 1) * pageSize}
        totalRecords={data?.totalCount ?? 0}
        onPage={(e) => onPageChange(Math.floor((e.first ?? 0) / pageSize) + 1)}
      >
        <Column
          header="S.No"
          body={(_row: ProjectTask, opts) => opts.rowIndex + 1} // rowIndex already includes the page offset (BUG-006)
          style={{ width: '4rem' }}
        />
        <Column
          header="Milestone/Task"
          body={(row: ProjectTask) => (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800">{row.title}</span>
              <span className="text-xs text-slate-500">{row.phaseName ? `${row.phaseName} Phase` : '—'}</span>
            </div>
          )}
        />
        <Column header="Assignee" body={(row: ProjectTask) => row.assigneeName} />
        <Column header="Logged Date" body={(row: ProjectTask) => dayjs(row.assignedDate).format('DD/MM/YYYY')} />
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

      <TaskLogDetailsDialog task={selected} onHide={() => setSelected(null)} />
    </div>
  )
}
