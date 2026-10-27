import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Controller, useFieldArray, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { formatCurrency } from '../../lib/format'
import { useCreatePurchaseOrder } from './purchaseOrders.hooks'
import { createPurchaseOrderSchema, type CreatePurchaseOrderValues } from './purchaseOrders.schema'

type LineValues = CreatePurchaseOrderValues['lineItems'][number]

// Quantity/price start blank; the schema rejects them until filled in.
const EMPTY_LINE = { description: '', quantity: undefined, unitPrice: undefined } as unknown as LineValues

const EMPTY: DefaultValues<CreatePurchaseOrderValues> = {
  vendorName: '',
  lineItems: [EMPTY_LINE],
  deliveryDate: undefined,
  notes: '',
}

// Item | Quantity | Unit Price | Total | delete — stacked on phones.
const LINE_GRID = 'grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_8.5rem_7.5rem_2rem] sm:gap-3'

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not create the purchase order. Please check the details and try again.'
}

interface NewPurchaseOrderDialogProps {
  projectId: string
  currencyCode: string
  visible: boolean
  onHide: () => void
}

export function NewPurchaseOrderDialog({ projectId, currencyCode, visible, onHide }: NewPurchaseOrderDialogProps) {
  const createPurchaseOrder = useCreatePurchaseOrder(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePurchaseOrderValues>({ resolver: zodResolver(createPurchaseOrderSchema), defaultValues: EMPTY })
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
  const lines = useWatch({ control, name: 'lineItems' }) ?? []

  const lineTotal = (line: Partial<LineValues> | undefined) => (line?.quantity ?? 0) * (line?.unitPrice ?? 0)
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const money = (amount: number) => formatCurrency(amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const close = () => {
    if (createPurchaseOrder.isPending) return
    reset(EMPTY)
    createPurchaseOrder.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    await createPurchaseOrder.mutateAsync({
      vendorName: values.vendorName,
      lineItems: values.lineItems,
      deliveryDate: values.deliveryDate ? dayjs(values.deliveryDate).format('YYYY-MM-DD') : undefined,
      notes: values.notes || undefined,
    })
    close()
  })

  const labelClass = 'text-[14px] font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="Create Purchase Order"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createPurchaseOrder.isPending}
      closable={!createPurchaseOrder.isPending}
      draggable={false}
      style={{ width: '46rem' }}
      className="form-dialog mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="po-vendor" className={labelClass}>
            Vendor
          </label>
          <Controller
            name="vendorName"
            control={control}
            render={({ field }) => (
              <InputText
                id="po-vendor"
                autoFocus
                placeholder="Enter vendor name"
                className="w-full"
                invalid={Boolean(errors.vendorName)}
                {...field}
              />
            )}
          />
          {errors.vendorName && <small className={errorClass}>{errors.vendorName.message}</small>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <span id="po-lines-label" className="text-[15px] font-semibold text-slate-900">
              Order Line Items
            </span>
            <span className="text-xs font-semibold text-slate-500">Currency: USD ($)</span>
          </div>

          <div role="group" aria-labelledby="po-lines-label" className="overflow-hidden rounded-md">
            <div className={`${LINE_GRID} hidden bg-blue-50 px-3 py-2.5 text-[13px] font-semibold text-slate-700 sm:grid`}>
              <span>Item</span>
              <span>Quantity</span>
              <span>Unit Price</span>
              <span>Total</span>
              <span className="sr-only">Remove</span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 sm:divide-y-0">
              {fields.map((field, index) => {
                const lineErrors = errors.lineItems?.[index]
                const firstError =
                  lineErrors?.description?.message ?? lineErrors?.quantity?.message ?? lineErrors?.unitPrice?.message
                return (
                  <div key={field.id} className="px-3 py-2.5">
                    <div className={LINE_GRID}>
                      <Controller
                        name={`lineItems.${index}.description`}
                        control={control}
                        render={({ field: f }) => (
                          <InputText
                            aria-label={`Item ${index + 1}`}
                            placeholder="Item"
                            className="po-line-input col-span-2 w-full sm:col-span-1"
                            invalid={Boolean(lineErrors?.description)}
                            {...f}
                          />
                        )}
                      />
                      <Controller
                        name={`lineItems.${index}.quantity`}
                        control={control}
                        render={({ field: f }) => (
                          <InputNumber
                            aria-label={`Quantity for item ${index + 1}`}
                            value={f.value ?? null}
                            // onChange commits per keystroke (onValueChange alone waits for blur, so a cleared
                            // error would shift "Add item" mid-click); onValueChange keeps the blur-time rounding.
                            onChange={(e) => f.onChange(e.value ?? undefined)}
                            onValueChange={(e) => f.onChange(e.value ?? undefined)}
                            onBlur={f.onBlur}
                            useGrouping={false}
                            placeholder="Qty"
                            invalid={Boolean(lineErrors?.quantity)}
                            className="w-full"
                            inputClassName="po-line-input w-full"
                          />
                        )}
                      />
                      <Controller
                        name={`lineItems.${index}.unitPrice`}
                        control={control}
                        render={({ field: f }) => (
                          <InputNumber
                            aria-label={`Unit price for item ${index + 1}`}
                            value={f.value ?? null}
                            // onChange commits per keystroke (onValueChange alone waits for blur, so a cleared
                            // error would shift "Add item" mid-click); onValueChange keeps the blur-time rounding.
                            onChange={(e) => f.onChange(e.value ?? undefined)}
                            onValueChange={(e) => f.onChange(e.value ?? undefined)}
                            onBlur={f.onBlur}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            prefix="$"
                            placeholder="$0.00"
                            invalid={Boolean(lineErrors?.unitPrice)}
                            className="w-full"
                            inputClassName="po-line-input w-full"
                          />
                        )}
                      />
                      <span className="text-[15px] text-slate-900" aria-label={`Total for item ${index + 1}`}>
                        <span className="text-slate-500 sm:hidden">Total: </span>
                        {money(lineTotal(lines[index]))}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label={`Remove item ${index + 1}`}
                        title="Remove item"
                        className="justify-self-end text-slate-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-400 sm:justify-self-center"
                      >
                        <i className="pi pi-trash" aria-hidden />
                      </button>
                    </div>
                    {firstError && <small className={`${errorClass} mt-1 block`}>{firstError}</small>}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 px-3 py-3">
              <button
                type="button"
                onClick={() => append(EMPTY_LINE)}
                disabled={fields.length >= 50}
                className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand hover:underline disabled:opacity-50"
              >
                <i className="pi pi-plus text-sm" aria-hidden /> Add item
              </button>
              <p className="flex items-baseline gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtotal:</span>
                <span className="text-xl font-bold text-brand" aria-live="polite">
                  {money(subtotal)}
                </span>
              </p>
            </div>
          </div>
          {errors.lineItems?.root && <small className={errorClass}>{errors.lineItems.root.message}</small>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="po-delivery-date" className={labelClass}>
            Delivery Date
          </label>
          <Controller
            name="deliveryDate"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="po-delivery-date"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                dateFormat="dd/mm/yy"
                placeholder="Choose date"
                showIcon
                icon="pi pi-calendar"
                className="w-full"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="po-notes" className={labelClass}>
            Note
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="po-notes"
                rows={3}
                placeholder="Brief note of supply, deliverable milestone, or inspection sign-off reference…"
                className="w-full resize-none"
                invalid={Boolean(errors.notes)}
                {...field}
              />
            )}
          />
          {errors.notes && <small className={errorClass}>{errors.notes.message}</small>}
        </div>

        {createPurchaseOrder.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createPurchaseOrder.error)}
          </div>
        )}

        {/* Stacked on phones — "Create Purchase Order" doesn't fit half of a 375px dialog. */}
        <div className="form-dialog-actions mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createPurchaseOrder.isPending} />
          <Button type="submit" label="Create Purchase Order" loading={createPurchaseOrder.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
