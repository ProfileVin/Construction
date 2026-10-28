import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useState } from 'react'
import { downloadBlob } from '../../lib/download'
import { exportTeamMembers, type TeamFilters, type TeamMember, type TeamMemberStatus } from './team.api'
import { useTeamMembers, useTeamRoles } from './team.hooks'
import { TeamMemberDialog } from './TeamMemberDialog'
import { TeamMemberFormDialog } from './TeamMemberFormDialog'
import { TeamTable } from './TeamTable'

const PAGE_SIZE = 8

const STATUS_OPTIONS: { label: string; value: TeamMemberStatus }[] = [
  { label: 'Active', value: 'Active' },
  { label: 'Deactivated', value: 'Deactivated' },
]

interface TeamPanelProps {
  projectId: string
  projectName: string
}

export function TeamPanel({ projectId, projectName }: TeamPanelProps) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [status, setStatus] = useState<TeamMemberStatus | null>(null)
  const [page, setPage] = useState(1)

  // `undefined` = form closed, `null` = invite, a member = edit.
  const [formMember, setFormMember] = useState<TeamMember | null | undefined>(undefined)
  const [openMember, setOpenMember] = useState<TeamMember | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const filters: TeamFilters = {
    search: search || undefined,
    role: role ?? undefined,
    status: status ?? undefined,
  }

  const { data, isLoading } = useTeamMembers(projectId, { ...filters, page, pageSize: PAGE_SIZE })
  const { data: roles } = useTeamRoles(projectId)

  const resetToFirstPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const exportCsv = async () => {
    setExportError(null)
    setExporting(true)
    try {
      downloadBlob(await exportTeamMembers(projectId, filters), 'team-members.csv')
    } catch {
      setExportError("Couldn't export the team list. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-brand-ink">{projectName} Team Members</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage trade allocations, assigned home zones, and daily on-site attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button label="Export" icon="pi pi-cloud-download" outlined loading={exporting} onClick={exportCsv} />
          <Button label="Invite Team Member" icon="pi pi-user-plus" onClick={() => setFormMember(null)} />
        </div>
      </div>

      <div className="toolbar-band mt-6 flex flex-wrap items-center gap-3 rounded-xl p-3">
        <span className="flat-search flex min-w-[220px] flex-1 items-center gap-2">
          <i className="pi pi-search text-slate-500" aria-hidden />
          <InputText
            value={search}
            onChange={(e) => resetToFirstPage(setSearch)(e.target.value)}
            placeholder="Search by name, role or email..."
            aria-label="Search team members"
            className="w-full"
          />
        </span>
        <div className="w-full sm:w-52">
          <Dropdown
            value={role}
            options={roles ?? []}
            onChange={(e) => resetToFirstPage(setRole)(e.value ?? null)}
            placeholder="All Roles"
            showClear
            aria-label="Filter by role"
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Dropdown
            value={status}
            options={STATUS_OPTIONS}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => resetToFirstPage(setStatus)(e.value ?? null)}
            placeholder="All Statuses"
            showClear
            dropdownIcon="pi pi-sliders-h"
            aria-label="Filter by status"
            className="w-full"
          />
        </div>
      </div>

      {exportError && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <TeamTable
        data={data}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onOpen={setOpenMember}
      />

      <TeamMemberDialog
        projectId={projectId}
        member={openMember}
        onHide={() => setOpenMember(null)}
        onChanged={setOpenMember}
        onEdit={(member) => {
          setOpenMember(null)
          setFormMember(member)
        }}
      />

      <TeamMemberFormDialog
        projectId={projectId}
        visible={formMember !== undefined}
        member={formMember}
        onHide={() => setFormMember(undefined)}
      />
    </div>
  )
}
