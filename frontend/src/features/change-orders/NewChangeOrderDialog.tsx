import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Controller, useForm, type DefaultValues } from 'react-hook-form'
import { useCreateChangeOrder } from './changeOrders.hooks'
import { createChangeOrderSchema, type CreateChangeOrderValues } from './changeOrders.schema'

// The date defaults to today each time the dialog opens (see `close`).
const emptyValues = (): DefaultValues<CreateChangeOrderValues> => ({
  description: '',
  amount: undefined,
  requestedDate: dayjs().startOf('day').toDate(),
  reason: '',
})

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not create the change order. Please check the details and try again.'
}

interface NewChangeOrderDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
}

export function NewChangeOrderDialog({ projectId, visible, onHide }: NewChangeOrderDialogProps) {
  const createChangeOrder = useCreateChangeOrder(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateChangeOrderValues>({ resolver: zodResolver(createChangeOrderSchema), defaultValues: emptyValues() })

  const close = () => {
    if (createChangeOrder.isPending) return
    reset(emptyValues())
    createChangeOrder.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    await createChangeOrder.mutateAsync({
      description: values.description,
      amount: values.amount,
      requestedDate: dayjs(values.requestedDate).format('YYYY-MM-DD'),
      reason: values.reason || undefined,
    })
    close()
  })

  const labelClass = 'text-[14px] font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="New Change Order"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createChangeOrder.isPending}
      closable={!createChangeOrder.isPending}
      draggable={false}
      style={{ width: '34rem' }}
      className="form-dialog form-dialog--compact mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="co-description" className={labelClass}>
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputText
                id="co-description"
                autoFocus
                placeholder="e.g. Upgrade to LED lighting"
                className="w-full"
                invalid={Boolean(errors.description)}
                {...field}
              />
            )}
          />
          {errors.description && <small className={errorClass}>{errors.description.message}</small>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="co-amount" className={labelClass}>
              Amount
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  inputId="co-amount"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value ?? undefined)}
                  onValueChange={(e) => field.onChange(e.value ?? undefined)}
                  onBlur={field.onBlur}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  prefix="$"
                  placeholder="$0.00"
                  invalid={Boolean(errors.amount)}
                  className="w-full"
                  inputClassName="w-full"
                />
              )}
            />
            {errors.amount && <small className={errorClass}>{errors.amount.message}</small>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="co-date" className={labelClass}>
              Date
            </label>
            <Controller
              name="requestedDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  inputId="co-date"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value ?? undefined)}
                  dateFormat="dd/mm/yy"
                  placeholder="Choose date"
                  showIcon
                  icon="pi pi-calendar"
                  invalid={Boolean(errors.requestedDate)}
                  className="w-full"
                />
              )}
            />
            {errors.requestedDate && <small className={errorClass}>{errors.requestedDate.message}</small>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="co-reason" className={labelClass}>
            Reason / Notes
          </label>
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="co-reason"
                rows={3}
                placeholder="Why the change is needed, who requested it, schedule impact…"
                className="w-full resize-none"
                invalid={Boolean(errors.reason)}
                {...field}
              />
            )}
          />
          {errors.reason && <small className={errorClass}>{errors.reason.message}</small>}
        </div>

        {createChangeOrder.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createChangeOrder.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createChangeOrder.isPending} />
          <Button type="submit" label="Create Change Order" loading={createChangeOrder.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
