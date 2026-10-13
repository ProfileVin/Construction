import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useCreatePhase } from './schedule.hooks'
import {
  constructionPhaseOptions,
  createPhaseSchema,
  derivePhaseStatus,
  type CreatePhaseValues,
} from './schedule.schema'

const EMPTY: Partial<CreatePhaseValues> = { title: '', phase: '', startDate: undefined, endDate: undefined }

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not create the milestone. Please check the details and try again.'
}

interface NewMilestoneDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
}

export function NewMilestoneDialog({ projectId, visible, onHide }: NewMilestoneDialogProps) {
  const createPhase = useCreatePhase(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePhaseValues>({ resolver: zodResolver(createPhaseSchema), defaultValues: EMPTY })

  const startDate = useWatch({ control, name: 'startDate' })

  const close = () => {
    if (createPhase.isPending) return
    reset(EMPTY)
    createPhase.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    await createPhase.mutateAsync({
      name: values.phase,
      checkpointLabel: values.title,
      startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      ...derivePhaseStatus(values.startDate, values.endDate),
    })
    close()
  })

  const labelClass = 'text-sm font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="Assign New Milestone"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createPhase.isPending}
      closable={!createPhase.isPending}
      draggable={false}
      style={{ width: '36rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="milestone-title" className={labelClass}>
            Milestone / Phase Title
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <InputText
                id="milestone-title"
                autoFocus
                placeholder="Enter details"
                className="w-full"
                invalid={Boolean(errors.title)}
                {...field}
              />
            )}
          />
          {errors.title && <small className={errorClass}>{errors.title.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="milestone-phase" className={labelClass}>
            Construction Phase
          </label>
          <Controller
            name="phase"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="milestone-phase"
                value={field.value || null}
                options={constructionPhaseOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select a phase"
                onChange={(e) => field.onChange(e.value ?? '')}
                onBlur={field.onBlur}
                invalid={Boolean(errors.phase)}
                className="w-full"
              />
            )}
          />
          {errors.phase && <small className={errorClass}>{errors.phase.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="milestone-start" className={labelClass}>
            Deadline
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    inputId="milestone-start"
                    aria-label="Start date"
                    value={field.value ?? null}
                    onChange={(e) => field.onChange(e.value ?? undefined)}
                    dateFormat="dd/mm/yy"
                    placeholder="Start date"
                    showIcon
                    icon="pi pi-calendar"
                    invalid={Boolean(errors.startDate)}
                    className="w-full"
                  />
                )}
              />
              {errors.startDate && <small className={errorClass}>{errors.startDate.message}</small>}
            </div>

            <div className="flex flex-col gap-2">
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    inputId="milestone-end"
                    aria-label="Completion date"
                    value={field.value ?? null}
                    onChange={(e) => field.onChange(e.value ?? undefined)}
                    minDate={startDate}
                    dateFormat="dd/mm/yy"
                    placeholder="Completion date"
                    showIcon
                    icon="pi pi-calendar"
                    invalid={Boolean(errors.endDate)}
                    className="w-full"
                  />
                )}
              />
              {errors.endDate && <small className={errorClass}>{errors.endDate.message}</small>}
            </div>
          </div>
        </div>

        {createPhase.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createPhase.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-2 grid grid-cols-2 gap-4 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createPhase.isPending} />
          <Button type="submit" label="Save" loading={createPhase.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
