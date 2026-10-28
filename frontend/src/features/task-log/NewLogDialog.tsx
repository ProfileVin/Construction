import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { AttachmentDropZone } from '../../components/AttachmentDropZone'
import { AssigneeDropdown } from '../dashboard/AssigneeDropdown'
import type { ActivityLogEntry, ProjectTask } from '../dashboard/dashboard.api'
import { useCreateActivityLog, useProjectTasks } from '../dashboard/dashboard.hooks'
import { createLogSchema, logCategoryOptions, type CreateLogValues } from '../dashboard/dashboard.schema'

const EMPTY: Partial<CreateLogValues> = {
  taskId: '',
  category: 'Framing',
  assigneeName: '',
  note: '',
  attachment: undefined,
}

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return 'That task no longer exists. Pick another one.'
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    // Kestrel's body-size rejection surfaces as a raw model-binding message — map it to ours.
    if (error.response?.status === 413 || first?.includes('too large')) return 'Attachments must be 25 MB or smaller.'
    if (first) return first
  }
  return 'Could not create the log. Please check the details and try again.'
}

interface NewLogDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
  onCreated?: (entry: ActivityLogEntry) => void
}

/** Task Log "New Log": a numbered activity-log entry (note, trade tag, assignee, attachment) on an existing task. */
export function NewLogDialog({ projectId, visible, onHide, onCreated }: NewLogDialogProps) {
  const createLog = useCreateActivityLog(projectId)
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(visible ? projectId : undefined)

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateLogValues>({ resolver: zodResolver(createLogSchema), defaultValues: EMPTY })

  const taskId = useWatch({ control, name: 'taskId' })
  const selectedTask = tasks?.find((t) => t.id === taskId)

  const close = () => {
    if (createLog.isPending) return
    reset(EMPTY)
    createLog.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    const entry = await createLog.mutateAsync(values)
    onCreated?.(entry)
    close()
  })

  const labelClass = 'text-sm font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="New Log"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createLog.isPending}
      closable={!createLog.isPending}
      draggable={false}
      style={{ width: '38rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="log-task" className={labelClass}>
            Milestone / Task
          </label>
          <Controller
            name="taskId"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="log-task"
                value={field.value || null}
                options={tasks ?? []}
                optionLabel="title"
                optionValue="id"
                placeholder={tasksLoading ? 'Loading tasks…' : 'Select a milestone'}
                filter={(tasks?.length ?? 0) > 8}
                filterBy="title,phaseName,assigneeName"
                emptyMessage="No tasks yet — create one from the Dashboard or Schedule"
                itemTemplate={(task: ProjectTask) => (
                  <div className="flex max-w-[32rem] min-w-0 flex-col">
                    <span className="truncate text-sm text-slate-900">{task.title}</span>
                    <span className="truncate text-xs text-slate-500">{task.phaseName ?? 'No phase'}</span>
                  </div>
                )}
                onChange={(e) => {
                  field.onChange(e.value ?? '')
                  // Default the assignee to the task's own, unless one was already picked.
                  const task = tasks?.find((t) => t.id === e.value)
                  if (task && !getValues('assigneeName')) {
                    setValue('assigneeName', task.assigneeName, { shouldValidate: true })
                  }
                }}
                onBlur={field.onBlur}
                invalid={Boolean(errors.taskId)}
                className="w-full"
              />
            )}
          />
          {errors.taskId && <small className={errorClass}>{errors.taskId.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <span id="log-category-label" className={labelClass}>
            Construction Phase
          </span>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <div role="group" aria-labelledby="log-category-label" className="flex flex-wrap gap-1.5">
                {logCategoryOptions.map((category) => (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={field.value === category}
                    onClick={() => field.onChange(category)}
                    className={`log-chip ${field.value === category ? 'is-active' : ''}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.category && <small className={errorClass}>{errors.category.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="log-assignee" className={labelClass}>
            Assignee
          </label>
          <Controller
            name="assigneeName"
            control={control}
            render={({ field }) => (
              <AssigneeDropdown
                projectId={projectId}
                enabled={visible}
                inputId="log-assignee"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.assigneeName)}
                currentName={selectedTask?.assigneeName}
                placeholder="Select assignee"
              />
            )}
          />
          {errors.assigneeName && <small className={errorClass}>{errors.assigneeName.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="log-note" className={labelClass}>
            Log Note
          </label>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="log-note"
                rows={4}
                placeholder="Enter work completed, inspection notes, contractor check-in, or site observations…"
                className="w-full resize-none"
                invalid={Boolean(errors.note)}
                {...field}
              />
            )}
          />
          {errors.note && <small className={errorClass}>{errors.note.message}</small>}
        </div>

        <Controller
          name="attachment"
          control={control}
          render={({ field }) => (
            <AttachmentDropZone
              label="Attachment"
              title="Attach photo, PDF report, or site document"
              value={field.value}
              onChange={field.onChange}
              error={errors.attachment?.message}
            />
          )}
        />

        {createLog.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createLog.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-2 grid grid-cols-2 gap-4 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createLog.isPending} />
          <Button type="submit" label="Create Log" loading={createLog.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
