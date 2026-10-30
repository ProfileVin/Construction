import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import type { ProjectTask } from '../dashboard/dashboard.api'
import { useDeleteProjectTask } from '../dashboard/dashboard.hooks'

interface DeleteTaskLogDialogProps {
  task: ProjectTask | null
  onCancel: () => void
  onDeleted: () => void
}

/** "Delete Log Entry?" — removes the task and its activity-log history; its documents stay in Documents. */
export function DeleteTaskLogDialog({ task, onCancel, onDeleted }: DeleteTaskLogDialogProps) {
  const remove = useDeleteProjectTask(task?.projectId)

  const cancel = () => {
    if (remove.isPending) return
    remove.reset()
    onCancel()
  }

  const confirm = async () => {
    if (!task) return
    await remove.mutateAsync(task.id)
    remove.reset()
    onDeleted()
  }

  return (
    <Dialog
      visible={task !== null}
      onHide={cancel}
      modal
      showHeader={false}
      dismissableMask={!remove.isPending}
      draggable={false}
      style={{ width: '32rem' }}
      breakpoints={{ '640px': '95vw' }}
      className="delete-confirm-dialog"
      contentClassName="rounded-2xl"
      aria-labelledby="delete-log-title"
    >
      <div className="flex flex-col items-center gap-2 pt-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500 bg-red-50" aria-hidden>
          <i className="pi pi-trash text-xl text-red-600" />
        </span>
        <h2 id="delete-log-title" className="mt-4 text-2xl font-semibold text-brand-ink">
          Delete Log Entry?
        </h2>
        <p className="text-sm text-slate-600">You are about to delete a log entry, this action is irreversible</p>

        {remove.isError && (
          <p role="alert" className="mt-2 w-full rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            Couldn’t delete this log. Please try again.
          </p>
        )}

        <div className="mt-4 grid w-full grid-cols-2 gap-4 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={cancel} disabled={remove.isPending} />
          <Button type="button" label="Delete Log" severity="danger" onClick={confirm} loading={remove.isPending} />
        </div>
      </div>
    </Dialog>
  )
}
