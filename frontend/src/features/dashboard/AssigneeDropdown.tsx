import { Dropdown } from 'primereact/dropdown'
import { useTeamMembers } from '../team/team.hooks'

const ACTIVE_MEMBERS = { status: 'Active', page: 1, pageSize: 100 } as const

interface AssigneeOption {
  label: string
  value: string
  role: string
}

interface AssigneeDropdownProps {
  projectId: string
  /** Only fetch the team while the owning dialog is open. */
  enabled: boolean
  inputId: string
  value: string
  onChange: (name: string) => void
  onBlur: () => void
  invalid: boolean
  /**
   * The task's saved assignee. Kept as an option when it isn't an active member (deactivated, or a
   * free-text seeded name), so editing never silently blanks it.
   */
  currentName?: string
  placeholder?: string
}

/** "Assigned To" picker of the project's active team members (name + role). */
export function AssigneeDropdown({
  projectId,
  enabled,
  inputId,
  value,
  onChange,
  onBlur,
  invalid,
  currentName,
  placeholder = 'Select an assignee',
}: AssigneeDropdownProps) {
  const { data: team, isLoading } = useTeamMembers(enabled ? projectId : undefined, ACTIVE_MEMBERS)

  const options: AssigneeOption[] = (team?.items ?? []).map((m) => ({
    label: m.fullName,
    value: m.fullName,
    role: m.roleTitle,
  }))
  if (currentName && !options.some((o) => o.value === currentName)) {
    options.unshift({ label: currentName, value: currentName, role: 'Not an active team member' })
  }

  return (
    <Dropdown
      inputId={inputId}
      value={value || null}
      options={options}
      optionLabel="label"
      optionValue="value"
      placeholder={isLoading ? 'Loading team…' : placeholder}
      filter={options.length > 8}
      emptyMessage="No team members yet — invite them on the Team page"
      itemTemplate={(option: AssigneeOption) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-900">{option.label}</span>
          <span className="text-xs text-slate-500">{option.role}</span>
        </div>
      )}
      onChange={(e) => onChange(e.value ?? '')}
      onBlur={onBlur}
      invalid={invalid}
      className="w-full"
    />
  )
}
