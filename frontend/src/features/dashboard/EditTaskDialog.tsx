import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputTextarea } from 'primereact/inputtextarea'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { usePhases } from '../schedule/schedule.hooks'
import { AssigneeDropdown } from './AssigneeDropdown'
import type { ProjectTask } from './dashboard.api'
import { useUpdateProjectTask } from './dashboard.hooks'
import { editTaskSchema, taskStatusOptions, type EditTaskValues } from './dashboard.schema'

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return 'This task no longer exists.'
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not save the task. Please check the details and try again.'
}

function toValues(task: ProjectTask): EditTaskValues {
  return {
    title: task.title,
    assigneeName: task.assigneeName,
    deadline: dayjs(task.deadline).toDate(),
    phaseId: task.phaseId,
    status: task.status,
  }
}

interface EditTaskDialogProps {
  task: ProjectTask | null
  onHide: () => void
}

export function EditTaskDialog({ task, onHide }: EditTaskDialogProps) {
  const projectId = task?.projectId
  const update = useUpdateProjectTask(projectId)
  const { data: phases } = usePhases(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditTaskValues>({ resolver: zodResolver(editTaskSchema) })

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
        // Not editable here; sent unchanged so the PUT keeps them.
        assignedDate: task.assignedDate,
        deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
        phaseId: values.phaseId,
        status: values.status,
        description: task.description,
      },
    })
    close()
  })

  const labelClass = 'text-sm font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="Edit Task"
      visible={task !== null}
      onHide={close}
      modal
      dismissableMask={!update.isPending}
      closable={!update.isPending}
      draggable={false}
      style={{ width: '36rem' }}
      className="form-dialog mx-4"
    >
      {task && (
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-details" className={labelClass}>
              Task Details
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="edit-task-details"
                  rows={4}
                  className="w-full resize-none"
                  invalid={Boolean(errors.title)}
                  {...field}
                />
              )}
            />
            {errors.title && <small className={errorClass}>{errors.title.message}</small>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-assignee" className={labelClass}>
              Assigned To:
            </label>
            <Controller
              name="assigneeName"
              control={control}
              render={({ field }) => (
                <AssigneeDropdown
                  projectId={task.projectId}
                  enabled
                  inputId="edit-task-assignee"
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

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-task-deadline" className={labelClass}>
              Deadline
            </label>
            <Controller
              name="deadline"
              control={control}
              render={({ field }) => (
                <Calendar
                  inputId="edit-task-deadline"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value ?? undefined)}
                  minDate={dayjs(task.assignedDate).toDate()}
                  dateFormat="dd/mm/yy"
                  placeholder="Select deadline"
                  showIcon
                  icon="pi pi-calendar"
                  invalid={Boolean(errors.deadline)}
                  className="w-full"
                />
              )}
            />
            {errors.deadline && <small className={errorClass}>{errors.deadline.message}</small>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="edit-task-phase" className={labelClass}>
                Phase
              </label>
              <Controller
                name="phaseId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    inputId="edit-task-phase"
                    value={field.value ?? null}
                    options={(phases ?? []).map((p) => ({ label: p.name, value: p.id }))}
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

            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="edit-task-status" className={labelClass}>
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    inputId="edit-task-status"
                    value={field.value}
                    options={[...taskStatusOptions]}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => field.onChange(e.value)}
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>

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
