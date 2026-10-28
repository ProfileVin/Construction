import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputSwitch } from 'primereact/inputswitch'
import { InputText } from 'primereact/inputtext'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { initials } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import { usePhases } from '../schedule/schedule.hooks'
import type { TeamMember } from './team.api'
import { useCreateTeamMember, useTeamMembers, useTeamRoles, useUpdateTeamMember } from './team.hooks'
import { teamMemberSchema, type TeamMemberValues } from './team.schema'

const EMPTY: TeamMemberValues = { fullName: '', roleTitle: '', specialty: '', email: '', phaseId: null }

// Same query as AssigneeDropdown, so it's usually already cached.
const ACTIVE_MEMBERS = { status: 'Active', page: 1, pageSize: 100 } as const

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) return 'A member with this email is already on the project.'
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not save the team member. Please try again.'
}

function AccessRow({ name, role }: { name: string; role: string }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <Avatar label={initials(name)} shape="circle" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[15px] text-slate-900" title={name}>
        {name}
      </span>
      <span className="max-w-[45%] truncate text-sm text-slate-500" title={role}>
        {role}
      </span>
    </li>
  )
}

interface TeamMemberFormDialogProps {
  projectId: string
  visible: boolean
  /** Edit this member; omit to invite a new one. */
  member?: TeamMember | null
  onHide: () => void
  onSaved?: (member: TeamMember) => void
}

export function TeamMemberFormDialog({ projectId, visible, member, onHide, onSaved }: TeamMemberFormDialogProps) {
  const isEdit = Boolean(member)
  const create = useCreateTeamMember(projectId)
  const update = useUpdateTeamMember(projectId)
  const save = member ? update : create
  const { data: phases } = usePhases(isEdit ? projectId : undefined)
  const { data: roles } = useTeamRoles(projectId)
  const { data: team } = useTeamMembers(isEdit ? undefined : projectId, ACTIVE_MEMBERS)
  const owner = useAuthStore((s) => s.user)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamMemberValues>({ resolver: zodResolver(teamMemberSchema), defaultValues: EMPTY })

  useEffect(() => {
    if (!visible) return
    reset(
      member
        ? {
            fullName: member.fullName,
            roleTitle: member.roleTitle,
            specialty: member.specialty ?? '',
            email: member.email,
            phaseId: member.phaseId,
          }
        : EMPTY,
    )
  }, [visible, member, reset])

  const close = () => {
    if (save.isPending) return
    create.reset()
    update.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    const payload = { ...values, specialty: values.specialty || null }
    const saved = member
      ? await update.mutateAsync({ memberId: member.id, payload })
      : await create.mutateAsync(payload)
    onSaved?.(saved)
    close()
  })

  const field = (id: keyof TeamMemberValues, label: string, optional = false) => ({
    id: `team-${id}`,
    label: (
      <label htmlFor={`team-${id}`} className="text-[14px] font-medium text-slate-900">
        {label} {optional && <span className="font-normal text-slate-500">(optional)</span>}
      </label>
    ),
    error: errors[id] && <small className="text-[13px] text-red-600">{errors[id]?.message}</small>,
  })

  const name = field('fullName', 'Full Name')
  const email = field('email', 'Email Address')
  const role = field('roleTitle', 'Role')
  const specialty = field('specialty', 'Specialty', true)
  const phase = field('phaseId', 'Assigned Phase', true)

  return (
    <Dialog
      header={isEdit ? 'Edit Team Member' : 'Invite New Team Member'}
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!save.isPending}
      closable={!save.isPending}
      draggable={false}
      style={{ width: '40rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {!isEdit && (
          <section aria-labelledby="team-access-heading" className="border-b border-slate-200 pb-4">
            <h3 id="team-access-heading" className="text-[14px] font-medium text-slate-900">
              Who Has Access
            </h3>
            <ul className="mt-2 max-h-40 overflow-y-auto pr-1">
              <AccessRow name={owner?.fullName ?? 'You'} role="Owner" />
              {(team?.items ?? []).map((m) => (
                <AccessRow key={m.id} name={m.fullName} role={m.roleTitle} />
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-1.5">
          {name.label}
          <Controller
            name="fullName"
            control={control}
            render={({ field: f }) => (
              <InputText
                id={name.id}
                placeholder="Enter name"
                className="w-full"
                invalid={Boolean(errors.fullName)}
                {...f}
              />
            )}
          />
          {name.error}
        </div>

        <div className="flex flex-col gap-1.5">
          {email.label}
          <Controller
            name="email"
            control={control}
            render={({ field: f }) => (
              <InputText
                id={email.id}
                type="email"
                placeholder="Enter email"
                className="w-full"
                invalid={Boolean(errors.email)}
                {...f}
              />
            )}
          />
          {email.error}
        </div>

        <div className="flex flex-col gap-1.5">
          {role.label}
          <Controller
            name="roleTitle"
            control={control}
            render={({ field: f }) => (
              <Dropdown
                inputId={role.id}
                value={f.value}
                options={roles ?? []}
                editable
                placeholder="Assign a role"
                onChange={(e) => f.onChange(e.value ?? '')}
                onBlur={f.onBlur}
                invalid={Boolean(errors.roleTitle)}
                className="w-full"
              />
            )}
          />
          {role.error}
        </div>

        {isEdit ? (
          <>
            <div className="flex flex-col gap-1.5">
              {specialty.label}
              <Controller
                name="specialty"
                control={control}
                render={({ field: f }) => (
                  <InputText
                    id={specialty.id}
                    placeholder="e.g. Main Feeder & Panel Board"
                    className="w-full"
                    invalid={Boolean(errors.specialty)}
                    {...f}
                  />
                )}
              />
              {specialty.error}
            </div>

            <div className="flex flex-col gap-1.5">
              {phase.label}
              <Controller
                name="phaseId"
                control={control}
                render={({ field: f }) => (
                  <Dropdown
                    inputId={phase.id}
                    value={f.value ?? null}
                    options={(phases ?? []).map((p) => ({ label: p.name, value: p.id }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="No phase"
                    showClear
                    onChange={(e) => f.onChange(e.value ?? null)}
                    className="w-full"
                  />
                )}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="team-link-expires" className="text-[14px] font-medium text-slate-900">
                Link Should Expire After Use
              </label>
              {/* shortcut: no invite links yet, so this is display-only; wire it up when invites exist. */}
              <InputSwitch inputId="team-link-expires" checked disabled />
            </div>
            <p className="text-xs text-slate-500">
              Invite links aren't available yet — the member is added straight to the team.
            </p>
          </div>
        )}

        {save.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(save.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={save.isPending} />
          <Button
            type="submit"
            label={isEdit ? 'Save Changes' : 'Send Invitation & Add Member'}
            loading={save.isPending}
          />
        </div>
      </form>
    </Dialog>
  )
}
