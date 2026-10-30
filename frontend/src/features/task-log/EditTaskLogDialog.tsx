import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton } from 'primereact/selectbutton'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { AttachmentDropZone } from '../../components/AttachmentDropZone'
import { formatFileSize } from '../../lib/format'
import { AssigneeDropdown } from '../dashboard/AssigneeDropdown'
import type { ProjectTask } from '../dashboard/dashboard.api'
import { useUpdateProjectTask } from '../dashboard/dashboard.hooks'
import {
  editTaskLogSchema,
  MAX_TASK_LOG_ATTACHMENTS,
  taskLogStatusOptions,
  type EditTaskLogValues,
} from '../dashboard/dashboard.schema'
import { usePhases } from '../schedule/schedule.hooks'

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return 'This log no longer exists.'
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not save the log. Please check the details and try again.'
}

function toValues(task: ProjectTask): EditTaskLogValues {
  return {
    title: task.title,
    assigneeName: task.assigneeName,
    assignedDate: dayjs(task.assignedDate).toDate(),
    deadline: dayjs(task.deadline).toDate(),
    phaseId: task.phaseId,
    status: task.status,
    description: task.description ?? '',
    attachments: [],
    removeAttachmentIds: [],
  }
}

interface EditTaskLogDialogProps {
  /** The full task (from `getProjectTask`), so its attachments are known. */
  task: ProjectTask | null
  onHide: () => void
}

export function EditTaskLogDialog({ task, onHide }: EditTaskLogDialogProps) {
  const projectId = task?.projectId
  const update = useUpdateProjectTask(projectId)
  const { data: phases } = usePhases(projectId)

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditTaskLogValues>({ resolver: zodResolver(editTaskLogSchema) })

  // Load the task's current values each time a (different) task opens.
  useEffect(() => {
    if (task) reset(toValues(task))
  }, [task, reset])

  const close = () => {
    if (update.isPending) return
    update.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    if (!task) return
    await update.mutateAsync({
      taskId: task.id,
      payload: {
        title: values.title,
        assigneeName: values.assigneeName,
        assignedDate: dayjs(values.assignedDate).format('YYYY-MM-DD'),
        deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
        phaseId: values.phaseId,
        status: values.status,
        description: values.description || null,
        attachments: values.attachments,
        removeAttachmentIds: values.removeAttachmentIds,
      },
    })
    close()
  })

  const assignedDate = useWatch({ control, name: 'assignedDate' })
  const removedIds = useWatch({ control, name: 'removeAttachmentIds' }) ?? []
  const keptAttachments = task?.attachments.filter((a) => !removedIds.includes(a.documentId)) ?? []

  const labelClass = 'text-sm font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'
  const fileRowClass = 'flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2'
  const trashClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-600 hover:bg-red-100'

  return (
    <Dialog
      header="Edit Task Log"
      visible={task !== null}
      onHide={close}
      modal
      dismissableMask={!update.isPending}
      closable={!update.isPending}
      draggable={false}
      style={{ width: '40rem' }}
      breakpoints={{ '768px': '95vw' }}
      className="form-dialog"
    >
      {task && (
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-log-title" className={labelClass}>
              Milestone / Task Name
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <InputText id="edit-log-title" className="w-full" invalid={Boolean(errors.title)} {...field} />
              )}
            />
            {errors.title && <small className={errorClass}>{errors.title.message}</small>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-log-phase" className={labelClass}>
              Phase / Category
            </label>
            <Controller
              name="phaseId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  inputId="edit-log-phase"
                  value={field.value ?? null}
                  options={(phases ?? []).map((p) => ({ label: `${p.name} Phase`, value: p.id }))}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="No phase"
                  showClear
                  onChange={(e) => field.onChange(e.value ?? null)}
                  className="w-full"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-log-assignee" className={labelClass}>
              Assignee
            </label>
            <Controller
              name="assigneeName"
              control={control}
              render={({ field }) => (
                <AssigneeDropdown
                  projectId={task.projectId}
                  enabled
                  inputId="edit-log-assignee"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={Boolean(errors.assigneeName)}
                  currentName={task.assigneeName}
                />
              )}
            />
            {errors.assigneeName && <small className={errorClass}>{errors.assigneeName.message}</small>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="edit-log-logged" className={labelClass}>
                Logged Date
              </label>
              <Controller
                name="assignedDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    inputId="edit-log-logged"
                    value={field.value ?? null}
                    onChange={(e) => field.onChange(e.value ?? undefined)}
                    dateFormat="dd/mm/yy"
                    showIcon
                    icon="pi pi-calendar"
                    iconPos="right"
                    invalid={Boolean(errors.assignedDate)}
                    className="w-full"
                  />
                )}
              />
              {errors.assignedDate && <small className={errorClass}>{errors.assignedDate.message}</small>}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="edit-log-due" className={labelClass}>
                Due Date
              </label>
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <Calendar
                    inputId="edit-log-due"
                    value={field.value ?? null}
                    onChange={(e) => field.onChange(e.value ?? undefined)}
                    minDate={assignedDate}
                    dateFormat="dd/mm/yy"
                    showIcon
                    icon="pi pi-calendar"
                    iconPos="right"
                    invalid={Boolean(errors.deadline)}
                    className="w-full"
                  />
                )}
              />
              {errors.deadline && <small className={errorClass}>{errors.deadline.message}</small>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span id="edit-log-status-label" className={labelClass}>
              Status
            </span>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SelectButton
                  aria-labelledby="edit-log-status-label"
                  value={field.value}
                  options={taskLogStatusOptions}
                  optionLabel="label"
                  optionValue="value"
                  allowEmpty={false}
                  onChange={(e) => field.onChange(e.value)}
                  className="expense-status-toggle task-log-status-toggle"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-log-description" className={labelClass}>
              Work Description &amp; Notes
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="edit-log-description"
                  rows={4}
                  className="w-full resize-none"
                  invalid={Boolean(errors.description)}
                  {...field}
                />
              )}
            />
            {errors.description && <small className={errorClass}>{errors.description.message}</small>}
          </div>

          <Controller
            name="attachments"
            control={control}
            render={({ field }) => {
              const files = field.value ?? []
              return (
                <div className="flex flex-col gap-2">
                  {files.length < MAX_TASK_LOG_ATTACHMENTS ? (
                    <AttachmentDropZone
                      label="Receipt / Supporting Voucher"
                      title="Attach invoice receipt or BOQ breakdown"
                      hint="PDF, PNG, JPG or XLSX up to 25MB"
                      value={undefined}
                      multiple
                      // getValues, not field.value: a multi-pick calls this once per file in the same tick.
                      onChange={(file) => file && field.onChange([...(getValues('attachments') ?? []), file])}
                    />
                  ) : (
                    <span className={labelClass}>Receipt / Supporting Voucher</span>
                  )}
                  <ul className="flex flex-col gap-2">
                    {keptAttachments.map((a) => (
                      <li key={a.documentId} className={fileRowClass}>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-slate-900" title={a.fileName}>
                            {a.fileName}
                          </span>
                          <span className="text-xs text-slate-600">{formatFileSize(a.sizeBytes)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setValue('removeAttachmentIds', [...removedIds, a.documentId], { shouldDirty: true })
                          }
                          aria-label={`Remove ${a.fileName}`}
                          className={trashClass}
                        >
                          <i className="pi pi-trash text-sm" aria-hidden />
                        </button>
                      </li>
                    ))}
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className={fileRowClass}>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-slate-900" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-xs text-slate-600">{formatFileSize(file.size)} · new</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => field.onChange(files.filter((_, i) => i !== index))}
                          aria-label={`Remove ${file.name}`}
                          className={trashClass}
                        >
                          <i className="pi pi-trash text-sm" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {errors.attachments && (
                    <small className={errorClass}>
                      {errors.attachments.message ??
                        (Array.isArray(errors.attachments)
                          ? errors.attachments.find((e) => e?.message)?.message
                          : undefined)}
                    </small>
                  )}
                </div>
              )
            }}
          />

          {update.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {getSaveErrorMessage(update.error)}
            </div>
          )}

          <div className="form-dialog-actions mt-2 grid grid-cols-2 gap-4 sm:gap-8">
            <Button type="button" label="Cancel" outlined onClick={close} disabled={update.isPending} />
            <Button type="submit" label="Save Changes" loading={update.isPending} disabled={!isDirty} />
          </div>
        </form>
      )}
    </Dialog>
  )
}
