import dayjs from 'dayjs'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { useActivityLog } from './dashboard.hooks'
import type { ActivityLogEntry } from './dashboard.api'

interface RecentLogPanelProps {
  projectId: string
}

export function RecentLogPanel({ projectId }: RecentLogPanelProps) {
  const { data: entries, isLoading } = useActivityLog(projectId)
  const [selected, setSelected] = useState<ActivityLogEntry | null>(null)

  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      {/* h-9 matches the New Task button row so both tables start at the same height */}
      <h2 className="flex h-9 items-center text-xl font-bold text-slate-900">Recent Log</h2>

      <div className="mt-3 overflow-x-auto">
        <DataTable
          value={entries ?? []}
          loading={isLoading}
          emptyMessage="No activity yet."
          className="dash-table min-w-[420px]"
        >
          <Column
            header="S.No"
            body={(_row: ActivityLogEntry, opts) => opts.rowIndex + 1}
            className="dash-table__center"
            headerClassName="dash-table__center"
            style={{ width: '3.25rem' }}
          />
          <Column
            header="Log Description"
            body={(row: ActivityLogEntry) => <span title={row.description}>{row.description}</span>}
          />
          <Column
            header="Action"
            body={(row: ActivityLogEntry) => (
              <button type="button" onClick={() => setSelected(row)} className="dash-link text-[13px] font-medium">
                View Details
              </button>
            )}
            style={{ width: '6.5rem' }}
          />
        </DataTable>
      </div>

      <Dialog
        header="Log details"
        visible={selected !== null}
        onHide={() => setSelected(null)}
        modal
        dismissableMask
        style={{ width: '26rem' }}
        className="mx-4"
      >
        {selected && (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] text-slate-800">{selected.description}</p>
            <p className="text-sm text-slate-500">{dayjs(selected.occurredAt).format('MMM D, YYYY h:mm A')}</p>
          </div>
        )}
      </Dialog>
    </div>
  )
}
