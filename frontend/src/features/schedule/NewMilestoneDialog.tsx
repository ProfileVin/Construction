import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { Controller, useForm } from 'react-hook-form'
import { useCreatePhase } from './schedule.hooks'
import { createPhaseSchema, phaseStatusOptions, type CreatePhaseValues } from './schedule.schema'

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
  } = useForm<CreatePhaseValues>({
    resolver: zodResolver(createPhaseSchema),
    defaultValues: { name: '', percentComplete: 0, status: 'Upcoming', checkpointLabel: '' },
  })

  const submit = handleSubmit(async (values) => {
    await createPhase.mutateAsync({
      name: values.name,
      startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      percentComplete: values.percentComplete,
      status: values.status,
      checkpointLabel: values.checkpointLabel || null,
    })
    reset()
    onHide()
  })

  return (
    <Dialog
      header="New milestone"
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      style={{ width: '28rem' }}
      className="mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[15px] font-semibold text-slate-800">
            Phase name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                id="name"
                autoFocus
                placeholder="e.g. Roof Framing"
                className="w-full"
                invalid={Boolean(errors.name)}
                {...field}
              />
            )}
          />
          {errors.name && <small className="text-[13px] text-red-600">{errors.name.message}</small>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="startDate" className="text-[15px] font-semibold text-slate-800">
              Start date
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  inputId="startDate"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="M d, yy"
                  showIcon
                  className="w-full"
                />
              )}
            />
            {errors.startDate && <small className="text-[13px] text-red-600">{errors.startDate.message}</small>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="endDate" className="text-[15px] font-semibold text-slate-800">
              End date
            </label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  inputId="endDate"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="M d, yy"
                  showIcon
                  className="w-full"
                />
              )}
            />
            {errors.endDate && <small className="text-[13px] text-red-600">{errors.endDate.message}</small>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="status" className="text-[15px] font-semibold text-slate-800">
              Status
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Dropdown
                  inputId="status"
                  value={field.value}
                  options={phaseStatusOptions as unknown as { label: string; value: string }[]}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) => field.onChange(e.value)}
                  className="w-full"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="percentComplete" className="text-[15px] font-semibold text-slate-800">
              Percent complete
            </label>
            <Controller
              name="percentComplete"
              control={control}
              render={({ field }) => (
                <InputNumber
                  inputId="percentComplete"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value ?? 0)}
                  min={0}
                  max={100}
                  suffix="%"
                  className="w-full"
                />
              )}
            />
            {errors.percentComplete && (
              <small className="text-[13px] text-red-600">{errors.percentComplete.message}</small>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="checkpointLabel" className="text-[15px] font-semibold text-slate-800">
            Checkpoint label
          </label>
          <Controller
            name="checkpointLabel"
            control={control}
            render={({ field }) => (
              <InputText
                id="checkpointLabel"
                placeholder="e.g. Trusses & Load Beams"
                className="w-full"
                {...field}
              />
            )}
          />
        </div>

        {createPhase.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            Could not create the milestone. Please check the details and try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" label="Cancel" outlined onClick={onHide} />
          <Button type="submit" label="Create milestone" loading={createPhase.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
