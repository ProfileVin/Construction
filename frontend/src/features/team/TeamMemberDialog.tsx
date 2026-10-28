import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import type { ReactNode } from 'react'
import type { TeamMember } from './team.api'
import { useSetTeamMemberStatus } from './team.hooks'
import { TeamStatusBadge } from './TeamStatusBadge'

interface TeamMemberDialogProps {
  projectId: string
  member: TeamMember | null
  onHide: () => void
  onEdit: (member: TeamMember) => void
  onChanged: (member: TeamMember) => void
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-[15px] text-slate-800">{children}</dd>
    </div>
  )
}

export function TeamMemberDialog({ projectId, member, onHide, onEdit, onChanged }: TeamMemberDialogProps) {
  const setStatus = useSetTeamMemberStatus(projectId)

  const close = () => {
    if (setStatus.isPending) return
    setStatus.reset()
    onHide()
  }

  const toggleStatus = async () => {
    if (!member) return
    const updated = await setStatus.mutateAsync({
      memberId: member.id,
      status: member.status === 'Active' ? 'Deactivated' : 'Active',
    })
    onChanged(updated)
  }

  return (
    <Dialog
      header={member?.fullName ?? 'Team member'}
      visible={member !== null}
      onHide={close}
      modal
      dismissableMask
      style={{ width: '30rem' }}
      className="mx-4"
    >
      {member && (
        <div className="flex flex-col gap-5">
          <TeamStatusBadge status={member.status} />

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Role / Trade">{member.roleTitle}</Detail>
            <Detail label="Specialty">{member.specialty ?? '—'}</Detail>
            <Detail label="Email">
              <a href={`mailto:${member.email}`} className="break-all text-sky-900 hover:underline">
                {member.email}
              </a>
            </Detail>
            <Detail label="Assigned phase">{member.phaseName ?? '—'}</Detail>
            <Detail label="Active tasks">{member.activeTaskCount}</Detail>
          </dl>

          {setStatus.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              Could not update the member's status. Please try again.
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              label={member.status === 'Active' ? 'Deactivate' : 'Reactivate'}
              icon={member.status === 'Active' ? 'pi pi-user-minus' : 'pi pi-user-plus'}
              severity={member.status === 'Active' ? 'danger' : undefined}
              outlined
              loading={setStatus.isPending}
              onClick={toggleStatus}
            />
            <Button
              type="button"
              label="Edit"
              icon="pi pi-pencil"
              disabled={setStatus.isPending}
              onClick={() => onEdit(member)}
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}
