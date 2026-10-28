import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Controller, useForm, type DefaultValues } from 'react-hook-form'
import { AttachmentDropZone } from '../../components/AttachmentDropZone'
import { formatFileSize } from '../../lib/format'
import { useBudgetSummary } from '../budget/budget.hooks'
import { useCreateChangeOrder } from './changeOrders.hooks'
import {
  changeOrderReasons,
  createChangeOrderSchema,
  MAX_CHANGE_ORDER_ATTACHMENTS,
  type CreateChangeOrderValues,
} from './changeOrders.schema'

const emptyValues = (): DefaultValues<CreateChangeOrderValues> => ({
  description: '',
  reason: undefined,
  scope: '',
  amount: undefined,
  categoryId: null,
  scheduleImpactDays: 0,
  attachments: [],
})

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    if (first) return first
  }
  return 'Could not submit the change order. Please check the details and try again.'
}

interface NewChangeOrderDialogProps {
  projectId: string
  visible: boolean
  onHide: () => void
}

export function NewChangeOrderDialog({ projectId, visible, onHide }: NewChangeOrderDialogProps) {
  const createChangeOrder = useCreateChangeOrder(projectId)
  const { data: budget } = useBudgetSummary(visible ? projectId : undefined)

  const {
    control,
    handleSubmit,
    getValues,
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
      reason: values.reason,
      scope: values.scope || undefined,
      amount: values.amount,
      categoryId: values.categoryId,
      scheduleImpactDays: values.scheduleImpactDays,
      // The request date is the submission day; the mockup has no date field.
      requestedDate: dayjs().format('YYYY-MM-DD'),
      attachments: values.attachments,
    })
    close()
  })

  const labelClass = 'text-[14px] font-medium text-slate-900'
  const sectionClass = 'border-b border-slate-200 pb-2 text-lg font-semibold text-brand-ink'
  const cardClass = 'flex min-w-0 flex-col gap-2 rounded-xl bg-blue-50 p-4'
  const cardLabelClass = 'text-[15px] font-semibold text-slate-900'
  const hintClass = 'text-xs text-slate-500'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header={
        <div className="flex flex-col gap-0.5">
          <span>New Change Order</span>
          <span className="text-sm font-normal text-slate-600">Submit a scope or cost revision for review.</span>
        </div>
      }
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createChangeOrder.isPending}
      closable={!createChangeOrder.isPending}
      draggable={false}
      style={{ width: '46rem' }}
      breakpoints={{ '768px': '95vw' }}
      className="form-dialog"
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <section className="flex flex-col gap-3">
          <h3 className={sectionClass}>Basic Information</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="co-description" className={labelClass}>
                Title/Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="co-description"
                    autoFocus
                    placeholder="e.g. Additional HVAC Units"
                    className="w-full"
                    invalid={Boolean(errors.description)}
                    {...field}
                  />
                )}
              />
              {errors.description && <small className={errorClass}>{errors.description.message}</small>}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="co-reason" className={labelClass}>
                Reason
              </label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    inputId="co-reason"
                    value={field.value ?? null}
                    options={[...changeOrderReasons]}
                    placeholder="Select a reason"
                    onChange={(e) => field.onChange(e.value ?? undefined)}
                    onBlur={field.onBlur}
                    invalid={Boolean(errors.reason)}
                    className="w-full"
                  />
                )}
              />
              {errors.reason && <small className={errorClass}>{errors.reason.message}</small>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="co-scope" className={labelClass}>
              Summary &amp; Scope <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <InputTextarea
                  id="co-scope"
                  rows={3}
                  placeholder="What changes, where, and what the work covers…"
                  className="w-full resize-none"
                  invalid={Boolean(errors.scope)}
                  {...field}
                />
              )}
            />
            {errors.scope && <small className={errorClass}>{errors.scope.message}</small>}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className={sectionClass}>Cost &amp; Schedule Impact</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={cardClass}>
              <label htmlFor="co-amount" className={cardLabelClass}>
                Estimated Cost ($)
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
                    prefix="$ "
                    placeholder="$ 0.00"
                    invalid={Boolean(errors.amount)}
                    className="w-full"
                    inputClassName="w-full font-semibold"
                  />
                )}
              />
              {errors.amount ? (
                <small className={errorClass}>{errors.amount.message}</small>
              ) : (
                <span className={hintClass}>Impacts current project contingency reserve.</span>
              )}
            </div>

            <div className={cardClass}>
              <label htmlFor="co-category" className={cardLabelClass}>
                Category / Trade
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    inputId="co-category"
                    value={field.value ?? null}
                    options={(budget?.categories ?? []).map((c) => ({ label: c.name, value: c.id }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select category"
                    emptyMessage="No budget categories yet"
                    showClear
                    onChange={(e) => field.onChange(e.value ?? null)}
                    className="w-full"
                  />
                )}
              />
              <span className={hintClass}>Assigned division code.</span>
            </div>

            <div className={cardClass}>
              <label htmlFor="co-impact" className={cardLabelClass}>
                Schedule Impact (Days)
              </label>
              <Controller
                name="scheduleImpactDays"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    inputId="co-impact"
                    value={field.value ?? null}
                    onChange={(e) => field.onChange(e.value ?? undefined)}
                    onValueChange={(e) => field.onChange(e.value ?? undefined)}
                    onBlur={field.onBlur}
                    min={0}
                    max={365}
                    suffix=" Days"
                    invalid={Boolean(errors.scheduleImpactDays)}
                    className="w-full"
                    inputClassName="w-full font-semibold"
                  />
                )}
              />
              {errors.scheduleImpactDays ? (
                <small className={errorClass}>{errors.scheduleImpactDays.message}</small>
              ) : (
                <span className={hintClass}>Added to critical path timeline milestone.</span>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className={sectionClass}>Attachments (Optional)</h3>
          <Controller
            name="attachments"
            control={control}
            render={({ field }) => {
              const files = field.value ?? []
              return (
                <div className="flex flex-col gap-2">
                  {files.length < MAX_CHANGE_ORDER_ATTACHMENTS && (
                    <AttachmentDropZone
                      label={<span className="sr-only">Attachments</span>}
                      title="Attach invoice receipt or BOQ breakdown"
                      hint={`PDF, PNG, JPG or XLSX up to 25MB · up to ${MAX_CHANGE_ORDER_ATTACHMENTS} files`}
                      value={undefined}
                      multiple
                      // getValues, not field.value: a multi-pick calls this once per file in the same tick.
                      onChange={(file) => file && field.onChange([...(getValues('attachments') ?? []), file])}
                    />
                  )}
                  {files.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex max-w-full items-center gap-2 rounded-lg bg-blue-50 py-1.5 pl-3 pr-1 text-sm"
                        >
                          <i className="pi pi-file text-xs text-slate-500" aria-hidden />
                          <span className="truncate font-medium text-slate-900" title={file.name}>
                            {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">({formatFileSize(file.size)})</span>
                          <button
                            type="button"
                            onClick={() => field.onChange(files.filter((_, i) => i !== index))}
                            aria-label={`Remove ${file.name}`}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          >
                            <i className="pi pi-times text-[10px]" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.attachments && (
                    <small className={errorClass}>
                      {errors.attachments.message ??
                        (Array.isArray(errors.attachments)
                          ? errors.attachments.find((e) => e?.message)?.message
                          : undefined)}
                    </small>
                  )}
                </div>
              )
            }}
          />
        </section>

        {createChangeOrder.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createChangeOrder.error)}
          </div>
        )}

        <div className="form-dialog-actions grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createChangeOrder.isPending} />
          <Button type="submit" label="Submit Change Order" loading={createChangeOrder.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
