import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Controller, useForm } from 'react-hook-form'
import { useCreateProjectTask } from './dashboard.hooks'
import { createTaskSchema, type CreateTaskValues } from './dashboard.schema'

interface NewTaskDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
}

export function NewTaskDialog({ projectId, visible, onHide }: NewTaskDialogProps) {
  const createTask = useCreateProjectTask(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', assigneeName: '' },
  })

  const submit = handleSubmit(async (values) => {
    await createTask.mutateAsync({
      title: values.title,
      assigneeName: values.assigneeName,
      assignedDate: dayjs(values.assignedDate).format('YYYY-MM-DD'),
      deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
    })
    reset()
    onHide()
  })

  return (
    <Dialog
      header="New task"
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      style={{ width: '28rem' }}
      className="mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-[15px] font-semibold text-slate-800">
            Task
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <InputText
                id="title"
                autoFocus
                placeholder="e.g. Sitting room electrical fittings"
                className="w-full"
                invalid={Boolean(errors.title)}
                {...field}
              />
            )}
          />
          {errors.title && <small className="text-[13px] text-red-600">{errors.title.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="assigneeName" className="text-[15px] font-semibold text-slate-800">
            Assignee
          </label>
          <Controller
            name="assigneeName"
            control={control}
            render={({ field }) => (
              <InputText
                id="assigneeName"
                placeholder="e.g. Mohammed Sani"
                className="w-full"
                invalid={Boolean(errors.assigneeName)}
                {...field}
              />
            )}
          />
          {errors.assigneeName && (
            <small className="text-[13px] text-red-600">{errors.assigneeName.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="assignedDate" className="text-[15px] font-semibold text-slate-800">
            Assigned date
          </label>
          <Controller
            name="assignedDate"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="assignedDate"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="M d, yy"
                showIcon
                className="w-full"
              />
            )}
          />
          {errors.assignedDate && (
            <small className="text-[13px] text-red-600">{errors.assignedDate.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="deadline" className="text-[15px] font-semibold text-slate-800">
            Deadline
          </label>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="deadline"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="M d, yy"
                showIcon
                className="w-full"
              />
            )}
          />
          {errors.deadline && (
            <small className="text-[13px] text-red-600">{errors.deadline.message}</small>
          )}
        </div>

        {createTask.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            Could not create the task. Please check the details and try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" label="Cancel" outlined onClick={onHide} />
          <Button type="submit" label="Create task" loading={createTask.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
