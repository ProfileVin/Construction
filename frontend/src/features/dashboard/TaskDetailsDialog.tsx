import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { openBlobInNewTab } from '../../lib/download'
import { fetchDocumentContent } from '../documents/documents.api'
import type { ProjectTask } from './dashboard.api'
import { EditTaskDialog } from './EditTaskDialog'

interface TaskDetailsDialogProps {
  task: ProjectTask | null
  onHide: () => void
}

export function TaskDetailsDialog({ task, onHide }: TaskDetailsDialogProps) {
  const [attachmentError, setAttachmentError] = useState(false)
  const [editing, setEditing] = useState(false)

  const openAttachment = async (t: ProjectTask) => {
    setAttachmentError(false)
    try {
      await openBlobInNewTab(() => fetchDocumentContent(t.projectId, t.attachmentDocumentId as string, false))
    } catch {
      setAttachmentError(true)
    }
  }

  const close = () => {
    setAttachmentError(false)
    setEditing(false)
    onHide()
  }

  return (
    <>
      <Dialog
        header="Task details"
        visible={task !== null && !editing}
        onHide={close}
        modal
        dismissableMask
        style={{ width: '26rem' }}
        className="mx-4"
      >
        {task && (
          <div className="flex flex-col gap-2">
            <p className="whitespace-pre-line wrap-break-word text-[15px] font-semibold text-slate-800">{task.title}</p>
            <p className="text-sm text-slate-500">
              {task.phaseName ? `${task.phaseName} Phase` : 'No phase'} · Assigned to {task.assigneeName}
            </p>
            <p className="text-sm text-slate-500">
              {dayjs(task.assignedDate).format('MMM D, YYYY')} – {dayjs(task.deadline).format('MMM D, YYYY')}
            </p>
            <div className="mt-1">
              <StatusBadge status={task.status} />
            </div>
            {task.attachmentDocumentId && (
              <button
                type="button"
                onClick={() => openAttachment(task)}
                className="dash-link mt-1 inline-flex items-center gap-1.5 self-start text-sm font-medium"
              >
                <i className="pi pi-paperclip text-xs" aria-hidden />
                Open attachment
              </button>
            )}
            {attachmentError && (
              <p role="alert" className="text-sm text-red-600">
                Couldn’t open the attachment. Please try again.
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <Button type="button" label="Edit" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />
            </div>
          </div>
        )}
      </Dialog>
      {/* Saving or cancelling the edit closes the whole flow, like the Team member Edit. */}
      <EditTaskDialog task={editing ? task : null} onHide={close} />
    </>
  )
}
