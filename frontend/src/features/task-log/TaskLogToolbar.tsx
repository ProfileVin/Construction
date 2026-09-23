import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { taskStatusOptions } from '../dashboard/dashboard.schema'
import { usePhases } from '../schedule/schedule.hooks'

interface TaskLogToolbarProps {
  projectId: string
  search: string
  onSearchChange: (value: string) => void
  phaseId: string | null
  onPhaseChange: (value: string | null) => void
  status: string | null
  onStatusChange: (value: string | null) => void
  dateRange: [Date | null, Date | null] | null
  onDateRangeChange: (value: [Date | null, Date | null] | null) => void
}

export function TaskLogToolbar({
  projectId,
  search,
  onSearchChange,
  phaseId,
  onPhaseChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: TaskLogToolbarProps) {
  const { data: phases } = usePhases(projectId)

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="search-field min-w-[220px] flex-1">
        <i className="pi pi-search text-slate-400" />
        <InputText
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter task titles, contractors..."
          aria-label="Filter task log"
        />
      </span>

      <div className="w-full sm:w-48">
        <Dropdown
          value={phaseId}
          options={(phases ?? []).map((p) => ({ label: p.name, value: p.id }))}
          optionLabel="label"
          optionValue="value"
          placeholder="All Categories"
          showClear
          onChange={(e) => onPhaseChange(e.value)}
          className="w-full"
        />
      </div>

      <div className="w-full sm:w-44">
        <Dropdown
          value={status}
          options={taskStatusOptions as unknown as { label: string; value: string }[]}
          optionLabel="label"
          optionValue="value"
          placeholder="All Statuses"
          showClear
          onChange={(e) => onStatusChange(e.value)}
          className="w-full"
        />
      </div>

      <div className="w-full sm:w-56">
        <Calendar
          value={dateRange as [Date, Date] | null}
          onChange={(e) => onDateRangeChange((e.value as [Date | null, Date | null]) ?? null)}
          selectionMode="range"
          placeholder="Date Range"
          showIcon
          readOnlyInput
          className="w-full"
        />
      </div>
    </div>
  )
}
