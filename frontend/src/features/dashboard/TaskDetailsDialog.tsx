import dayjs from 'dayjs'
import { Dialog } from 'primereact/dialog'
import { StatusBadge } from '../../components/StatusBadge'
import type { ProjectTask } from './dashboard.api'

interface TaskDetailsDialogProps {
  task: ProjectTask | null
  onHide: () => void
}

export function TaskDetailsDialog({ task, onHide }: TaskDetailsDialogProps) {
  return (
    <Dialog
      header="Task details"
      visible={task !== null}
      onHide={onHide}
      modal
      dismissableMask
      style={{ width: '26rem' }}
      className="mx-4"
    >
      {task && (
        <div className="flex flex-col gap-2">
          <p className="text-[15px] font-semibold text-slate-800">{task.title}</p>
          <p className="text-sm text-slate-500">
            {task.phaseName ? `${task.phaseName} Phase` : 'No phase'} · Assigned to {task.assigneeName}
          </p>
          <p className="text-sm text-slate-500">
            {dayjs(task.assignedDate).format('MMM D, YYYY')} – {dayjs(task.deadline).format('MMM D, YYYY')}
          </p>
          <div className="mt-1">
            <StatusBadge status={task.status} />
          </div>
        </div>
      )}
    </Dialog>
  )
}
