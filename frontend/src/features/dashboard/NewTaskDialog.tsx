import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Controller, useForm } from 'react-hook-form'
import { AttachmentDropZone } from '../../components/AttachmentDropZone'
import { AssigneeDropdown } from './AssigneeDropdown'
import { useCreateProjectTask } from './dashboard.hooks'
import { createTaskSchema, type CreateTaskValues } from './dashboard.schema'

const EMPTY: Partial<CreateTaskValues> = { title: '', assigneeName: '', deadline: undefined, attachment: undefined }

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    // Kestrel's body-size rejection surfaces as a raw model-binding message — map it to ours.
    if (error.response?.status === 413 || first?.includes('too large')) return 'Attachments must be 25 MB or smaller.'
    if (first) return first
  }
  return 'Could not create the task. Please check the details and try again.'
}

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
  } = useForm<CreateTaskValues>({ resolver: zodResolver(createTaskSchema), defaultValues: EMPTY })

  const close = () => {
    if (createTask.isPending) return
    reset(EMPTY)
    createTask.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    await createTask.mutateAsync({
      title: values.title,
      assigneeName: values.assigneeName,
      assignedDate: dayjs().format('YYYY-MM-DD'),
      deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
      status: 'Upcoming',
      attachment: values.attachment,
    })
    close()
  })

  const labelClass = 'text-sm font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="Assign New Task"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createTask.isPending}
      closable={!createTask.isPending}
      draggable={false}
      style={{ width: '36rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="task-details" className={labelClass}>
            Task Details
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="task-details"
                rows={4}
                autoFocus
                placeholder="Enter details"
                className="w-full resize-none"
                invalid={Boolean(errors.title)}
                {...field}
              />
            )}
          />
          {errors.title && <small className={errorClass}>{errors.title.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="task-assignee" className={labelClass}>
            Assigned To:
          </label>
          <Controller
            name="assigneeName"
            control={control}
            render={({ field }) => (
              <AssigneeDropdown
                projectId={projectId}
                enabled={visible}
                inputId="task-assignee"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={Boolean(errors.assigneeName)}
              />
            )}
          />
          {errors.assigneeName && <small className={errorClass}>{errors.assigneeName.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="task-deadline" className={labelClass}>
            Deadline
          </label>
          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="task-deadline"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                minDate={dayjs().startOf('day').toDate()}
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

        <Controller
          name="attachment"
          control={control}
          render={({ field }) => (
            <AttachmentDropZone
              label={
                <>
                  Attachment <span className="font-normal text-slate-500">(optional)</span>
                </>
              }
              title="Attach photo, CAD, or site document"
              value={field.value}
              onChange={field.onChange}
              error={errors.attachment?.message}
            />
          )}
        />

        {createTask.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createTask.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-2 grid grid-cols-2 gap-4 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createTask.isPending} />
          <Button type="submit" label="Save" loading={createTask.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
