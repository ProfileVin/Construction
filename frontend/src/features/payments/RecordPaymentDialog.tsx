import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputTextarea } from 'primereact/inputtextarea'
import { Controller, useForm, type DefaultValues } from 'react-hook-form'
import { useCreatePayment, usePaymentPayees } from './payments.hooks'
import { createPaymentSchema, directionOptions, methodOptions, type CreatePaymentValues } from './payments.schema'

// A function so each reset defaults the date to "today", not to when the module loaded.
const emptyValues = (): DefaultValues<CreatePaymentValues> => ({
  direction: 'Inbound',
  partyName: '',
  amount: undefined,
  paymentDate: new Date(),
  method: 'Ach',
  notes: '',
})

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not record the payment. Please check the details and try again.'
}

interface RecordPaymentDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
}

export function RecordPaymentDialog({ projectId, visible, onHide }: RecordPaymentDialogProps) {
  const createPayment = useCreatePayment(projectId)
  const { data: payees } = usePaymentPayees(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePaymentValues>({ resolver: zodResolver(createPaymentSchema), defaultValues: emptyValues() })

  const close = () => {
    if (createPayment.isPending) return
    reset(emptyValues())
    createPayment.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    await createPayment.mutateAsync({
      direction: values.direction,
      partyName: values.partyName,
      amount: values.amount,
      paymentDate: dayjs(values.paymentDate).format('YYYY-MM-DD'),
      method: values.method,
      notes: values.notes || undefined,
    })
    close()
  })

  const labelClass = 'text-[14px] font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="Record Payment"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createPayment.isPending}
      closable={!createPayment.isPending}
      draggable={false}
      style={{ width: '40rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-direction" className={labelClass}>
            Payment Type
          </label>
          <Controller
            name="direction"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="payment-direction"
                value={field.value}
                options={directionOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => field.onChange(e.value)}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-party" className={labelClass}>
            Client/Payee
          </label>
          <Controller
            name="partyName"
            control={control}
            render={({ field }) => (
              // Editable: pick a name already used on the project or type a new one.
              <Dropdown
                inputId="payment-party"
                value={field.value}
                options={payees ?? []}
                editable
                placeholder="Choose or type a name"
                onChange={(e) => field.onChange(e.value ?? '')}
                onBlur={field.onBlur}
                invalid={Boolean(errors.partyName)}
                className="w-full"
              />
            )}
          />
          {errors.partyName && <small className={errorClass}>{errors.partyName.message}</small>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-amount" className={labelClass}>
              Amount (USD)
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  inputId="payment-amount"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value ?? undefined)}
                  onValueChange={(e) => field.onChange(e.value ?? undefined)}
                  onBlur={field.onBlur}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  prefix="$"
                  placeholder="$"
                  invalid={Boolean(errors.amount)}
                  className="w-full"
                  inputClassName="w-full"
                />
              )}
            />
            {errors.amount && <small className={errorClass}>{errors.amount.message}</small>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-date" className={labelClass}>
              Payment Date
            </label>
            <Controller
              name="paymentDate"
              control={control}
              render={({ field }) => (
                <Calendar
                  inputId="payment-date"
                  value={field.value ?? null}
                  onChange={(e) => field.onChange(e.value ?? undefined)}
                  dateFormat="dd/mm/yy"
                  placeholder="Choose date"
                  showIcon
                  icon="pi pi-calendar"
                  invalid={Boolean(errors.paymentDate)}
                  className="w-full"
                />
              )}
            />
            {errors.paymentDate && <small className={errorClass}>{errors.paymentDate.message}</small>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-method" className={labelClass}>
            Payment Method
          </label>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="payment-method"
                value={field.value}
                options={methodOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => field.onChange(e.value)}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-notes" className={labelClass}>
            Note (Optional)
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="payment-notes"
                rows={3}
                placeholder="Brief note of payment details…"
                className="w-full resize-none"
                invalid={Boolean(errors.notes)}
                {...field}
              />
            )}
          />
          {errors.notes && <small className={errorClass}>{errors.notes.message}</small>}
        </div>

        {createPayment.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createPayment.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createPayment.isPending} />
          <Button type="submit" label="Record Payment" loading={createPayment.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
