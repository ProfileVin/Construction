import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { pagerTemplate } from '../../components/pagerTemplate'
import type { PagedTeamMembers, TeamMember } from './team.api'
import { TeamStatusBadge } from './TeamStatusBadge'

interface TeamTableProps {
  data: PagedTeamMembers | undefined
  isLoading: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onOpen: (member: TeamMember) => void
}

export function TeamTable({ data, isLoading, page, pageSize, onPageChange, onOpen }: TeamTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <DataTable
        value={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No team members found."
        className="app-table min-w-[960px]"
        paginator
        lazy
        rows={pageSize}
        first={(page - 1) * pageSize}
        totalRecords={data?.totalCount ?? 0}
        onPage={(e) => onPageChange(Math.floor((e.first ?? 0) / pageSize) + 1)}
        paginatorTemplate={pagerTemplate}
      >
        <Column
          header="S.No"
          body={(_row: TeamMember, opts) => opts.rowIndex + 1} // rowIndex already includes the page offset (BUG-006)
          style={{ width: '4.5rem' }}
          bodyClassName="text-center"
          headerClassName="app-table__center"
        />
        <Column
          header="Member Name"
          body={(row: TeamMember) => (
            <div className="flex max-w-[14rem] flex-col gap-1 break-words">
              <span className="text-[15px] text-slate-800">{row.fullName}</span>
              <span className="text-xs text-slate-500">
                {row.phaseName ? `${row.phaseName} Phase` : 'No phase assigned'}
              </span>
            </div>
          )}
        />
        <Column
          header="Role/Trade"
          body={(row: TeamMember) => (
            <div className="flex max-w-[14rem] flex-col gap-1 break-words">
              <span className="text-[15px] text-slate-800">{row.roleTitle}</span>
              {row.specialty && <span className="text-xs text-slate-500">{row.specialty}</span>}
            </div>
          )}
        />
        <Column
          header="Email"
          body={(row: TeamMember) => (
            <span className="block max-w-[13rem] truncate" title={row.email}>
              {row.email}
            </span>
          )}
        />
        <Column
          header="Active Tasks"
          body={(row: TeamMember) => (
            <span className="inline-block whitespace-nowrap rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {row.activeTaskCount} {row.activeTaskCount === 1 ? 'Task' : 'Tasks'}
            </span>
          )}
        />
        <Column header="Status" body={(row: TeamMember) => <TeamStatusBadge status={row.status} />} />
        <Column
          header="Action"
          body={(row: TeamMember) => (
            <button
              type="button"
              onClick={() => onOpen(row)}
              aria-label={`Open ${row.fullName}`}
              className="text-[15px] font-semibold text-sky-900 hover:underline"
            >
              Open
            </button>
          )}
        />
      </DataTable>
    </div>
  )
}
