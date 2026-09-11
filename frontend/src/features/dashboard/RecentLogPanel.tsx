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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-brand-ink">Recent Log</h2>

      <div className="mt-4 overflow-x-auto">
        <DataTable value={entries ?? []} loading={isLoading} emptyMessage="No activity yet." className="min-w-[420px]">
          <Column header="S.No" body={(_row: ActivityLogEntry, opts) => opts.rowIndex + 1} style={{ width: '4rem' }} />
          <Column field="description" header="Log Description" />
          <Column
            header="Action"
            body={(row: ActivityLogEntry) => (
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
