import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { useState } from 'react'
import { NewTaskDialog } from '../dashboard/NewTaskDialog'
import { TaskLogTable } from './TaskLogTable'
import { TaskLogToolbar } from './TaskLogToolbar'
import { useTaskLog } from './taskLog.hooks'
import type { TaskLogFilters } from './taskLog.api'

const PAGE_SIZE = 8

interface TaskLogPanelProps {
  projectId: string
  projectName: string
}

export function TaskLogPanel({ projectId, projectName }: TaskLogPanelProps) {
  const [newLogVisible, setNewLogVisible] = useState(false)
  const [search, setSearch] = useState('')
  const [phaseId, setPhaseId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null)
  const [page, setPage] = useState(1)

  const filters: TaskLogFilters = {
    search: search || undefined,
    phaseId: phaseId ?? undefined,
    status: (status as TaskLogFilters['status']) ?? undefined,
    fromDate: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
    toDate: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading } = useTaskLog(projectId, filters)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-ink">Task Log</h1>
          <p className="text-sm text-slate-500">{projectName} · Architectural &amp; Systems Logbook</p>
        </div>
        <Button label="New Log" icon="pi pi-plus" size="small" onClick={() => setNewLogVisible(true)} />
      </div>

      <TaskLogToolbar
        projectId={projectId}
        search={search}
        onSearchChange={resetToFirstPage(setSearch)}
        phaseId={phaseId}
        onPhaseChange={resetToFirstPage(setPhaseId)}
        status={status}
        onStatusChange={resetToFirstPage(setStatus)}
        dateRange={dateRange}
        onDateRangeChange={resetToFirstPage(setDateRange)}
      />

      <TaskLogTable data={data} isLoading={isLoading} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <NewTaskDialog projectId={projectId} visible={newLogVisible} onHide={() => setNewLogVisible(false)} />
    </div>
  )
}
