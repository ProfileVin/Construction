import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { usePhases } from '../schedule/schedule.hooks'
import type { TeamMember } from './team.api'
import { useCreateTeamMember, useTeamRoles, useUpdateTeamMember } from './team.hooks'
import { teamMemberSchema, type TeamMemberValues } from './team.schema'

const EMPTY: TeamMemberValues = { fullName: '', roleTitle: '', specialty: '', email: '', phaseId: null }

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) return 'A member with this email is already on the project.'
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not save the team member. Please try again.'
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
  const create = useCreateTeamMember(projectId)
  const update = useUpdateTeamMember(projectId)
  const save = member ? update : create
  const { data: phases } = usePhases(projectId)
  const { data: roles } = useTeamRoles(projectId)

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
      <label htmlFor={`team-${id}`} className="text-[15px] font-semibold text-slate-800">
        {label} {optional && <span className="font-normal text-slate-500">(optional)</span>}
      </label>
    ),
    error: errors[id] && <small className="text-[13px] text-red-600">{errors[id]?.message}</small>,
  })

  const name = field('fullName', 'Full name')
  const role = field('roleTitle', 'Role / Trade')
  const specialty = field('specialty', 'Specialty', true)
  const email = field('email', 'Email')
  const phase = field('phaseId', 'Assigned phase', true)

  return (
    <Dialog
      header={member ? 'Edit team member' : 'Invite team member'}
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!save.isPending}
      closable={!save.isPending}
      style={{ width: '32rem' }}
      className="mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          {name.label}
          <Controller
            name="fullName"
            control={control}
            render={({ field: f }) => <InputText id={name.id} className="w-full" invalid={Boolean(errors.fullName)} {...f} />}
          />
          {name.error}
        </div>

        <div className="flex flex-col gap-2">
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
                placeholder="e.g. Lead Electrician"
                onChange={(e) => f.onChange(e.value ?? '')}
                onBlur={f.onBlur}
                invalid={Boolean(errors.roleTitle)}
                className="w-full"
              />
            )}
          />
          {role.error}
        </div>

        <div className="flex flex-col gap-2">
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

        <div className="flex flex-col gap-2">
          {email.label}
          <Controller
            name="email"
            control={control}
            render={({ field: f }) => (
              <InputText id={email.id} type="email" className="w-full" invalid={Boolean(errors.email)} {...f} />
            )}
          />
          {email.error}
        </div>

        <div className="flex flex-col gap-2">
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

        {save.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(save.error)}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={save.isPending} />
          <Button
            type="submit"
            label={member ? 'Save changes' : 'Add member'}
            icon={member ? 'pi pi-check' : 'pi pi-user-plus'}
            loading={save.isPending}
          />
        </div>
      </form>
    </Dialog>
  )
}
