import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { openBlobInNewTab } from '../../lib/download'
import { fetchDocumentContent } from '../documents/documents.api'
import type { ActivityLogEntry } from './dashboard.api'
import { useUpdateActivityLog } from './dashboard.hooks'
import { logDescriptionSchema, type LogDescriptionValues } from './dashboard.schema'

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return 'This log entry no longer exists.'
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not save the description. Please try again.'
}

function phaseLabel(entry: ActivityLogEntry) {
  if (!entry.phaseName) return 'No phase'
  return entry.phaseNumber ? `${String(entry.phaseNumber).padStart(2, '0')}. ${entry.phaseName}` : entry.phaseName
}

interface LogDetailsDialogProps {
  projectId: string
  entry: ActivityLogEntry | null
  onHide: () => void
}

export function LogDetailsDialog({ projectId, entry, onHide }: LogDetailsDialogProps) {
  const update = useUpdateActivityLog(projectId)
  const [attachmentError, setAttachmentError] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LogDescriptionValues>({ resolver: zodResolver(logDescriptionSchema), defaultValues: { description: '' } })

  // Load the selected entry's text each time a (different) entry opens.
  useEffect(() => {
    if (entry) reset({ description: entry.description })
  }, [entry, reset])

  const close = () => {
    if (update.isPending) return
    update.reset()
    setAttachmentError(false)
    onHide()
  }

  const submit = handleSubmit(async ({ description }) => {
    if (!entry) return
    await update.mutateAsync({ entryId: entry.id, description })
    close()
  })

  const openAttachment = async (e: ActivityLogEntry) => {
    setAttachmentError(false)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(e.projectId, e.attachmentDocumentId as string, false))
    } catch {
      setAttachmentError(true)
    }
  }

  const title = entry?.taskTitle ?? 'Activity log entry'

  const header = entry && (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm font-normal text-slate-700">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-700">
          #{entry.logNumber}
        </span>
        <span aria-hidden>•</span>
        <time dateTime={entry.occurredAt}>{dayjs(entry.occurredAt).format('D MMM YYYY')}</time>
      </div>
      <h2 title={title} className="line-clamp-2 text-[17px] font-medium wrap-anywhere text-slate-900">
        {title}
      </h2>
    </div>
  )

  const infoLabel = 'text-[11px] font-semibold tracking-wide text-slate-600'

  return (
    <Dialog
      header={header}
      visible={entry !== null}
      onHide={close}
      modal
      dismissableMask={!update.isPending}
      closable={!update.isPending}
      draggable={false}
      style={{ width: '36rem' }}
      className="form-dialog mx-4"
    >
      {entry && (
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <dl className="log-info-box grid grid-cols-1 gap-4 px-4 py-3.5 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1">
              <dt className={infoLabel}>Phase/Milestone</dt>
              <dd className="truncate text-[15px] text-slate-900">
                {phaseLabel(entry)}
                {entry.category && (
                  <span className="ml-2 rounded bg-white px-1.5 py-0.5 align-middle text-xs text-slate-600">
                    {entry.category}
                  </span>
                )}
              </dd>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <dt className={infoLabel}>Assignee</dt>
              <dd className="truncate text-[15px] text-slate-900">{entry.assigneeName ?? '—'}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <label htmlFor="log-description" className={infoLabel}>
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="log-description"
                  rows={3}
                  autoResize
                  className="log-description w-full"
                  invalid={Boolean(errors.description)}
                  {...field}
                />
              )}
            />
            {errors.description && (
              <small className="text-[13px] text-red-600">{errors.description.message}</small>
            )}
          </div>

          {entry.attachmentDocumentId && (
            <button
              type="button"
              onClick={() => openAttachment(entry)}
              className="dash-link inline-flex items-center gap-2 self-start text-sm"
            >
              <i className="pi pi-paperclip" aria-hidden />
              Open attachment
            </button>
          )}
          {attachmentError && (
            <small role="alert" className="-mt-3 text-[13px] text-red-600">
              Could not open the attachment.
            </small>
          )}

          {update.isError && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {getSaveErrorMessage(update.error)}
            </div>
          )}

          <div className="form-dialog-actions mt-2 grid grid-cols-2 gap-4 sm:gap-8">
            <Button type="button" label="Cancel" outlined onClick={close} disabled={update.isPending} />
            <Button type="submit" label="Save" loading={update.isPending} disabled={!isDirty} />
          </div>
        </form>
      )}
    </Dialog>
  )
}
