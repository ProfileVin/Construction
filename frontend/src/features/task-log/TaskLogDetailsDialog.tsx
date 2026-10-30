import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { openBlobInNewTab } from '../../lib/download'
import { formatFileSize } from '../../lib/format'
import type { ProjectTask } from '../dashboard/dashboard.api'
import { useProjectTask } from '../dashboard/dashboard.hooks'
import { fetchDocumentContent, type DocumentFormat } from '../documents/documents.api'
import { useTeamMembers } from '../team/team.hooks'
import { DeleteTaskLogDialog } from './DeleteTaskLogDialog'
import { EditTaskLogDialog } from './EditTaskLogDialog'

// Same filters as AssigneeDropdown, so the team list is shared from the query cache.
const ACTIVE_MEMBERS = { status: 'Active', page: 1, pageSize: 100 } as const

const FORMAT_ICON: Record<DocumentFormat, string> = {
  Image: 'pi-image',
  Pdf: 'pi-file-pdf',
  Word: 'pi-file-word',
  Spreadsheet: 'pi-file-excel',
  Other: 'pi-file',
}

interface TaskLogDetailsDialogProps {
  task: ProjectTask | null
  onHide: () => void
}

/** Task Log → "View Details": summary, attachments, Edit Log and Delete (the Schedule page has its own dialog). */
export function TaskLogDetailsDialog({ task: row, onHide }: TaskLogDetailsDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [attachmentError, setAttachmentError] = useState(false)
  const projectId = row?.projectId
  const { data: detail, isLoading } = useProjectTask(projectId, row?.id)
  const { data: team } = useTeamMembers(projectId, ACTIVE_MEMBERS)

  // The table row until the full task (description, attachments) arrives — and after edits, the fresh copy.
  const task = detail ?? row
  const role = task && team?.items.find((m) => m.fullName === task.assigneeName)?.roleTitle

  const close = () => {
    setMode('view')
    setAttachmentError(false)
    onHide()
  }

  const openAttachment = async (documentId: string) => {
    if (!projectId) return
    setAttachmentError(false)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(projectId, documentId, false))
    } catch {
      setAttachmentError(true)
    }
  }

  const cardClass = 'rounded-xl border border-slate-200 px-4 py-3'

  return (
    <>
      <Dialog
        header={
          task && (
            <div className="flex flex-col gap-2 pr-2">
              <span className="text-lg font-semibold text-brand-ink">Task Log Details: {task.title}</span>
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={task.status} />
                <button
                  type="button"
                  onClick={() => setMode('delete')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
                >
                  <i className="pi pi-trash text-xs" aria-hidden />
                  Delete
                </button>
              </div>
            </div>
          )
        }
        visible={row !== null && mode === 'view'}
        onHide={close}
        modal
        dismissableMask
        draggable={false}
        style={{ width: '40rem' }}
        breakpoints={{ '768px': '95vw' }}
        className="form-dialog"
      >
        {task && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className={cardClass}>
                <p className="text-sm font-medium text-slate-700">Assignee</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-900">{task.assigneeName}</p>
                {role && <p className="mt-2 text-sm text-slate-600">{role}</p>}
              </div>
              <div className={cardClass}>
                <p className="text-sm font-medium text-slate-700">Logged Date</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-900">
                  {dayjs(task.assignedDate).format('DD/MM/YYYY')}
                </p>
                <p className="mt-2 text-sm text-slate-600">Due: {dayjs(task.deadline).format('DD/MM/YYYY')}</p>
              </div>
            </div>

            <section className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Summary &amp; Scope</h3>
              {isLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading…</p>
              ) : task.description ? (
                <p className="mt-2 whitespace-pre-line wrap-break-word text-[15px] leading-relaxed text-slate-700">
                  {task.description}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-slate-500">No summary yet — add one with Edit Log.</p>
              )}

              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-xs font-semibold text-slate-700">Attachments</p>
                {!isLoading && task.attachments.length === 0 ? (
                  <p className="mt-2 text-sm italic text-slate-500">No attachments.</p>
                ) : (
                  <ul className="mt-2 flex flex-col items-start gap-2">
                    {task.attachments.map((a) => (
                      <li key={a.documentId} className="max-w-full">
                        <button
                          type="button"
                          onClick={() => openAttachment(a.documentId)}
                          className="flex max-w-full items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm hover:bg-blue-100"
                        >
                          <i className={`pi ${FORMAT_ICON[a.format]} text-slate-600`} aria-hidden />
                          <span className="truncate font-semibold text-slate-900">{a.fileName}</span>
                          <span className="shrink-0 text-xs text-slate-500">({formatFileSize(a.sizeBytes)})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {attachmentError && (
                  <p role="alert" className="mt-2 text-sm text-red-600">
                    Couldn’t open the attachment. Please try again.
                  </p>
                )}
              </div>
            </section>

            <div className="form-dialog-actions mt-2 grid grid-cols-2 gap-4 sm:gap-8">
              <Button type="button" label="Edit Log" outlined onClick={() => setMode('edit')} disabled={!detail} />
              <Button type="button" label="Done" onClick={close} />
            </div>
          </div>
        )}
      </Dialog>

      {/* Edit returns here (the detail query refetches); a delete closes the whole flow. */}
      <EditTaskLogDialog task={mode === 'edit' ? (detail ?? null) : null} onHide={() => setMode('view')} />
      <DeleteTaskLogDialog task={mode === 'delete' ? task : null} onCancel={() => setMode('view')} onDeleted={close} />
    </>
  )
}
