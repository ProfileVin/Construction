import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { Controller, useForm } from 'react-hook-form'
import { useCreateInvoice } from './budget.hooks'
import { createInvoiceSchema, invoiceStatusOptions, type CreateInvoiceValues } from './budget.schema'
import type { BudgetCategory } from './budget.api'

interface NewExpenseDialogProps {
  projectId: string
  categories: BudgetCategory[]
  visible: boolean
  onHide: () => void
}

export function NewExpenseDialog({ projectId, categories, visible, onHide }: NewExpenseDialogProps) {
  const createInvoice = useCreateInvoice(projectId)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: { vendorName: '', categoryId: null, status: 'Pending' },
  })

  const submit = handleSubmit(async (values) => {
    await createInvoice.mutateAsync({
      vendorName: values.vendorName,
      categoryId: values.categoryId ?? null,
      amount: values.amount,
      status: values.status,
      issuedDate: dayjs(values.issuedDate).format('YYYY-MM-DD'),
    })
    reset()
    onHide()
  })

  return (
    <Dialog
      header="New expense"
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      style={{ width: '28rem' }}
      className="mx-4"
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="vendorName" className="text-[15px] font-semibold text-slate-800">
            Vendor
          </label>
          <Controller
            name="vendorName"
            control={control}
            render={({ field }) => (
              <InputText
                id="vendorName"
                autoFocus
                placeholder="e.g. Pioneer Wire & Cable"
                className="w-full"
                invalid={Boolean(errors.vendorName)}
                {...field}
              />
            )}
          />
          {errors.vendorName && <small className="text-[13px] text-red-600">{errors.vendorName.message}</small>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="categoryId" className="text-[15px] font-semibold text-slate-800">
            Category
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Dropdown
                inputId="categoryId"
                value={field.value ?? null}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                optionLabel="label"
                optionValue="value"
                placeholder="No category"
                showClear
                onChange={(e) => field.onChange(e.value)}
                className="w-full"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="text-[15px] font-semibold text-slate-800">
              Amount
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  inputId="amount"
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value ?? 0)}
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  className="w-full"
                />
              )}
            />
            {errors.amount && <small className="text-[13px] text-red-600">{errors.amount.message}</small>}
          </div>

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
                  options={invoiceStatusOptions as unknown as { label: string; value: string }[]}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) => field.onChange(e.value)}
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="issuedDate" className="text-[15px] font-semibold text-slate-800">
            Issued date
          </label>
          <Controller
            name="issuedDate"
            control={control}
            render={({ field }) => (
              <Calendar
                inputId="issuedDate"
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="M d, yy"
                showIcon
                className="w-full"
              />
            )}
          />
          {errors.issuedDate && <small className="text-[13px] text-red-600">{errors.issuedDate.message}</small>}
        </div>

        {createInvoice.isError && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
            Could not create the expense. Please check the details and try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" label="Cancel" outlined onClick={onHide} />
          <Button type="submit" label="Create expense" loading={createInvoice.isPending} />
        </div>
      </form>
    </Dialog>
  )
}
