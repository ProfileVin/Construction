import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton } from 'primereact/selectbutton'
import { Controller, useForm } from 'react-hook-form'
import { AttachmentDropZone } from '../../components/AttachmentDropZone'
import { useCreateInvoice } from './budget.hooks'
import { createInvoiceSchema, invoiceStatusOptions, type CreateInvoiceValues } from './budget.schema'
import type { BudgetCategory } from './budget.api'

const EMPTY: Partial<CreateInvoiceValues> = {
  title: '',
  categoryId: undefined,
  amount: undefined,
  referenceNumber: '',
  billingDate: undefined,
  status: 'Pending',
  notes: '',
  receipt: undefined,
}

function getSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const errors = error.response?.data?.errors as Record<string, string[]> | undefined
    const first = errors && Object.values(errors).flat()[0]
    // Kestrel's body-size rejection surfaces as a raw model-binding message — map it to ours.
    if (error.response?.status === 413 || first?.includes('too large')) return 'Receipts must be 25 MB or smaller.'
    if (first) return first
  }
  return 'Could not record the expense. Please check the details and try again.'
}

interface NewExpenseDialogProps {
  projectId: string
  categories: BudgetCategory[]
  visible: boolean
  onHide: () => void
}

/** "Record New Expense" — creates an invoice; the title is stored as the vendor line under the invoice number. */
export function NewExpenseDialog({ projectId, categories, visible, onHide }: NewExpenseDialogProps) {
  const createInvoice = useCreateInvoice(projectId)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateInvoiceValues>({ resolver: zodResolver(createInvoiceSchema), defaultValues: EMPTY })

  const close = () => {
    if (createInvoice.isPending) return
    reset(EMPTY)
    createInvoice.reset()
    onHide()
  }

  const submit = handleSubmit(async (values) => {
    if (categories.length > 0 && !values.categoryId) {
      setError('categoryId', { message: 'Select a category' })
      return
    }
    await createInvoice.mutateAsync({
      vendorName: values.title,
      categoryId: values.categoryId ?? null,
      amount: values.amount,
      status: values.status,
      issuedDate: dayjs(values.billingDate).format('YYYY-MM-DD'),
      referenceNumber: values.referenceNumber || undefined,
      notes: values.notes || undefined,
      receipt: values.receipt,
    })
    close()
  })

  const labelClass = 'text-[13px] leading-[18px] font-medium text-slate-900'
  const errorClass = 'text-[13px] text-red-600'

  return (
    <Dialog
      header="Record New Expense"
      visible={visible}
      onHide={close}
      modal
      dismissableMask={!createInvoice.isPending}
      closable={!createInvoice.isPending}
      draggable={false}
      style={{ width: '38rem' }}
      className="form-dialog form-dialog--compact mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-2.5" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="expense-title" className={labelClass}>
            Expense / Invoice Title
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <InputText
                id="expense-title"
                autoFocus
                placeholder="Title"
                className="w-full"
                invalid={Boolean(errors.title)}
                {...field}
              />
            )}
          />
          {errors.title && <small className={errorClass}>{errors.title.message}</small>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expense-category" className={labelClass}>
            Budget Category
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="expense-category"
                value={field.value ?? null}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                optionLabel="label"
                optionValue="value"
                placeholder="Select a category"
                emptyMessage="No budget categories yet"
                onChange={(e) => field.onChange(e.value ?? undefined)}
                onBlur={field.onBlur}
                invalid={Boolean(errors.categoryId)}
                className="w-full"
              />
            )}
          />
          {errors.categoryId && <small className={errorClass}>{errors.categoryId.message}</small>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expense-amount" className={labelClass}>
            Amount (USD)
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                inputId="expense-amount"
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                onBlur={field.onBlur}
                mode="decimal"
                minFractionDigits={2}
                maxFractionDigits={2}
                prefix="$ "
                placeholder="$"
                invalid={Boolean(errors.amount)}
                className="w-full"
                inputClassName="w-full"
              />
            )}
          />
          {errors.amount && <small className={errorClass}>{errors.amount.message}</small>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expense-reference" className={labelClass}>
            Invoice / Reference #
          </label>
          <Controller
            name="referenceNumber"
            control={control}
            render={({ field }) => (
              <InputText
                id="expense-reference"
                placeholder="#1234fre"
                className="w-full"
                invalid={Boolean(errors.referenceNumber)}
                {...field}
              />
            )}
          />
          {errors.referenceNumber && <small className={errorClass}>{errors.referenceNumber.message}</small>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expense-billing-date" className={labelClass}>
            Billing Date
          </label>
          <Controller
            name="billingDate"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="expense-billing-date"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                dateFormat="dd/mm/yy"
                placeholder="Choose date"
                showIcon
                icon="pi pi-calendar"
                invalid={Boolean(errors.billingDate)}
                className="w-full"
              />
            )}
          />
          {errors.billingDate && <small className={errorClass}>{errors.billingDate.message}</small>}
        </div>

        <div className="flex flex-col gap-1">
          <span id="expense-status-label" className={labelClass}>
            Payment Status
          </span>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SelectButton
                aria-labelledby="expense-status-label"
                value={field.value}
                options={invoiceStatusOptions}
                optionLabel="label"
                optionValue="value"
                allowEmpty={false}
                onChange={(e) => field.onChange(e.value)}
                className="expense-status-toggle"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="expense-notes" className={labelClass}>
            Expense Notes &amp; Scope Description
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                id="expense-notes"
                rows={2}
                placeholder="Brief scope of supply, deliverable milestone, or inspection sign-off reference…"
                className="w-full resize-none"
                invalid={Boolean(errors.notes)}
                {...field}
              />
            )}
          />
          {errors.notes && <small className={errorClass}>{errors.notes.message}</small>}
        </div>

        <Controller
          name="receipt"
          control={control}
          render={({ field }) => (
            <AttachmentDropZone
              label="Receipt / Supporting Voucher"
              title="Attach invoice receipt or BOQ breakdown"
              hint="PDF, PNG, JPG or XLSX up to 25MB"
              value={field.value}
              onChange={field.onChange}
              error={errors.receipt?.message}
              compact
            />
          )}
        />

        {createInvoice.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {getSaveErrorMessage(createInvoice.error)}
          </div>
        )}

        <div className="form-dialog-actions mt-1 grid grid-cols-2 gap-4 sm:gap-8">
          <Button type="button" label="Cancel" outlined onClick={close} disabled={createInvoice.isPending} />
          <Button type="submit" label="Record Expense" loading={createInvoice.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
