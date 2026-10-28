import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { openBlobInNewTab } from '../../lib/download'
import { fetchDocumentContent } from '../documents/documents.api'
import { useTeamMembers } from '../team/team.hooks'
import type { ProjectTask } from './dashboard.api'
import { useExtendTaskDeadline, useTaskActivityLog } from './dashboard.hooks'
import {
  deadlineExtensionReasons,
  extendDeadlineSchema,
  taskStatusOptions,
  type ExtendDeadlineValues,
} from './dashboard.schema'
import { EditTaskDialog } from './EditTaskDialog'

// Same filters as AssigneeDropdown, so the team list is shared from the query cache.
const ACTIVE_MEMBERS = { status: 'Active', page: 1, pageSize: 100 } as const

function remainingLabel(deadline: string): { text: string; urgent: boolean } {
  const days = dayjs(deadline).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (days < 0) return { text: `Overdue by ${-days} ${-days === 1 ? 'Day' : 'Days'}`, urgent: true }
  if (days === 0) return { text: 'Due Today', urgent: true }
  return { text: `${days} ${days === 1 ? 'Day' : 'Days'} Remaining`, urgent: days <= 7 }
}

function serverError(error: unknown, field: string): string | undefined {
  if (!isAxiosError(error)) return undefined
  return (error.response?.data?.errors as Record<string, string[]> | undefined)?.[field]?.[0]
}

interface TaskDetailsDialogProps {
  task: ProjectTask | null
  onHide: () => void
}

/** Schedule → Upcoming Deadlines → "View Details": deadline, assignee, the task's logs and "Extend Deadline". */
export function TaskDetailsDialog({ task, onHide }: TaskDetailsDialogProps) {
  const [attachmentError, setAttachmentError] = useState(false)
  const [editing, setEditing] = useState(false)
  const projectId = task?.projectId
  const { data: logs, isLoading: logsLoading } = useTaskActivityLog(projectId, task?.id)
  const { data: team } = useTeamMembers(projectId, ACTIVE_MEMBERS)
  const extend = useExtendTaskDeadline(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExtendDeadlineValues>({ resolver: zodResolver(extendDeadlineSchema) })

  useEffect(() => {
    if (task) reset({ deadline: undefined, reason: undefined })
  }, [task, reset])

  const openAttachment = async (documentId: string) => {
    if (!projectId) return
    setAttachmentError(false)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(projectId, documentId, false))
    } catch {
      setAttachmentError(true)
    }
  }

  const close = () => {
    if (extend.isPending) return
    setAttachmentError(false)
    setEditing(false)
    extend.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    if (!task) return
    await extend.mutateAsync({
      taskId: task.id,
      deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
      reason: values.reason,
    })
    close()
  })

  const trade = task && team?.items.find((m) => m.fullName === task.assigneeName)?.roleTitle
  const remaining = task && remainingLabel(task.deadline)
  const deadlineServerError = serverError(extend.error, 'deadline')

  const labelClass = 'text-sm font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'
  const cardClass = 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'

  return (
    <>
      <Dialog
        header={
          task && (
            <div className="flex flex-col gap-0.5 pr-2">
              <span className="text-lg font-bold text-brand-ink">
                {task.title} — Deadline &amp; Milestone Details
              </span>
              <span className="flex items-center gap-2 text-sm font-normal text-slate-600">
                Status:
                <span className="font-semibold text-brand">
                  {taskStatusOptions.find((o) => o.value === task.status)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="dash-link ml-1 inline-flex items-center gap-1 text-xs font-medium"
                >
                  <i className="pi pi-pencil text-[10px]" aria-hidden />
                  Edit task
                </button>
              </span>
            </div>
          )
        }
        visible={task !== null && !editing}
        onHide={close}
        modal
        dismissableMask={!extend.isPending}
        closable={!extend.isPending}
        draggable={false}
        style={{ width: '46rem' }}
        breakpoints={{ '768px': '95vw' }}
        className="form-dialog"
      >
        {task && remaining && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={cardClass}>
                <p className="text-xs font-medium text-slate-500">Due Date</p>
                <p className="mt-1 text-2xl font-medium text-slate-900">{dayjs(task.deadline).format('MMMM D, YYYY')}</p>
                <span
                  className={`mt-2 inline-block rounded-md px-2 py-0.5 text-sm ${
                    remaining.urgent ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {remaining.text}
                </span>
              </div>
              <div className={cardClass}>
                <p className="text-xs font-medium text-slate-500">Assignee</p>
                <p className="mt-1 text-2xl font-medium text-slate-900">{task.assigneeName}</p>
                {trade && (
                  <p className="mt-2 text-sm text-slate-600">
                    Trade: <span className="text-brand">{trade}</span>
                  </p>
                )}
                {task.attachmentDocumentId && (
                  <button
                    type="button"
                    onClick={() => openAttachment(task.attachmentDocumentId as string)}
                    className="dash-link mt-2 inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    <i className="pi pi-paperclip text-xs" aria-hidden />
                    Open attachment
                  </button>
                )}
              </div>
            </div>

            <section className="rounded-xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Task Logs &amp; Updates</h3>
              <div className="mt-3 flex max-h-80 flex-col gap-3 overflow-y-auto">
                {logsLoading && <p className="text-sm text-slate-500">Loading updates…</p>}
                {!logsLoading && (logs ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">No updates logged yet.</p>
                )}
                {logs?.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                    <p className="whitespace-pre-line wrap-break-word text-sm text-slate-800">{entry.description}</p>
                    {entry.attachmentDocumentId && (
                      <button
                        type="button"
                        onClick={() => openAttachment(entry.attachmentDocumentId as string)}
                        className="dash-link mt-1 inline-flex items-center gap-1.5 text-xs font-medium"
                      >
                        <i className="pi pi-paperclip text-[10px]" aria-hidden />
                        Attachment
                      </button>
                    )}
                    <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Logged by:{' '}
                        <span className="text-brand">
                          {entry.assigneeName ?? task.assigneeName}
                          {entry.category ? ` (${entry.category})` : ''}
                        </span>
                      </span>
                      <span>{dayjs(entry.occurredAt).format('MMMM D, YYYY · hh:mm A')}</span>
                    </div>
                  </article>
                ))}
              </div>
              {attachmentError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  Couldn’t open the attachment. Please try again.
                </p>
              )}
            </section>

            <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Extend Deadline</h3>

              <div className="flex flex-col gap-2">
                <label htmlFor="extend-deadline-date" className={labelClass}>
                  New Target Deadline
                </label>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      inputId="extend-deadline-date"
                      value={field.value ?? null}
                      onChange={(e) => field.onChange(e.value ?? undefined)}
                      minDate={dayjs(task.deadline).add(1, 'day').toDate()}
                      dateFormat="dd/mm/yy"
                      placeholder="Select deadline"
                      showIcon
                      icon="pi pi-calendar"
                      iconPos="right"
                      invalid={Boolean(errors.deadline || deadlineServerError)}
                      className="w-full"
                    />
                  )}
                />
                {(errors.deadline || deadlineServerError) && (
                  <small className={errorClass}>{errors.deadline?.message ?? deadlineServerError}</small>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="extend-deadline-reason" className={labelClass}>
                  Reason For Extension
                </label>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      inputId="extend-deadline-reason"
                      value={field.value ?? null}
                      options={[...deadlineExtensionReasons]}
                      placeholder="Select a reason"
                      onChange={(e) => field.onChange(e.value ?? undefined)}
                      onBlur={field.onBlur}
                      invalid={Boolean(errors.reason)}
                      className="w-full"
                    />
                  )}
                />
                {errors.reason && <small className={errorClass}>{errors.reason.message}</small>}
              </div>

              {extend.isError && !deadlineServerError && (
                <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {isAxiosError(extend.error) && extend.error.response?.status === 404
                    ? 'This task no longer exists.'
                    : 'Could not extend the deadline. Please try again.'}
                </div>
              )}

              <div className="form-dialog-actions grid grid-cols-2 gap-4 sm:gap-8">
                <Button type="button" label="Cancel" outlined onClick={close} disabled={extend.isPending} />
                <Button type="submit" label="Confirm Extension" loading={extend.isPending} />
              </div>
            </form>
          </div>
        )}
      </Dialog>
      {/* Saving or cancelling the edit closes the whole flow, like the Team member Edit. */}
      <EditTaskDialog task={editing ? task : null} onHide={close} />
    </>
  )
}
